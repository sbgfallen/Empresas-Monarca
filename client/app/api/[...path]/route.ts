/**
 * Next.js App Router catch-all that bridges to the Express serverless function.
 */
import { NextRequest, NextResponse } from "next/server";
import { PassThrough } from "node:stream";

let expressHandler: ((req: any, res: any) => Promise<void>) | null = null;

function getHandler() {
  if (expressHandler) return expressHandler;
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("../../../server/vercel-handler");
  expressHandler = typeof mod === "function" ? mod : mod.default || mod;
  return expressHandler;
}

async function handleRequest(
  request: NextRequest,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path } = await ctx.params;
  const apiPath = "/api/" + path.join("/");
  const url = new URL(request.url);

  // Collect body bytes
  let body: Buffer | undefined;
  if (request.body) {
    const ab = await request.arrayBuffer();
    body = Buffer.from(ab);
  }

  // Parse cookies
  const cookieHeader = request.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((c) => {
    const [key, ...rest] = c.trim().split("=");
    if (key) cookies[decodeURIComponent(key)] = decodeURIComponent(rest.join("="));
  });

  // Build Node.js IncomingMessage-like object
  const nodeReq = Object.assign(new PassThrough(), {
    method: request.method,
    url: apiPath + url.search,
    originalUrl: apiPath + url.search,
    headers: Object.fromEntries(request.headers.entries()),
    httpVersion: "1.1",
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    socket: { remoteAddress: "127.0.0.1" },
    cookies,
    get connection() { return this.socket; },
  });

  // Pipe body into the stream
  if (body) {
    process.nextTick(() => {
      nodeReq.push(body);
      nodeReq.push(null);
    });
  } else {
    process.nextTick(() => nodeReq.push(null));
  }

  // Collect response
  const chunks: Buffer[] = [];
  let statusCode = 200;
  let resHeaders: Record<string, string> = {};

  const _statusCode = { value: 200 };

  const nodeRes: any = {
    get statusCode() { return _statusCode.value; },
    set statusCode(v: number) { _statusCode.value = v; },
    headersSent: false,
    _headers: {} as Record<string, string>,
    setHeader(name: string, value: string | string[]) {
      this._headers[name.toLowerCase()] = Array.isArray(value)
        ? value.join(", ")
        : String(value);
    },
    getHeader(name: string) {
      return this._headers[name.toLowerCase()];
    },
    removeHeader(name: string) {
      delete this._headers[name.toLowerCase()];
    },
    writeHead(code: number, hdrs?: Record<string, string>) {
      _statusCode.value = code;
      if (hdrs) Object.assign(this._headers, hdrs);
      return this;
    },
    write(chunk: string | Buffer) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      return true;
    },
    end(chunk?: string | Buffer) {
      if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      this.headersSent = true;
      statusCode = _statusCode.value;
      resHeaders = { ...this._headers };
    },
    status(code: number) {
      _statusCode.value = code;
      return this;
    },
    cookie() { return this; },
    redirect() { this.end(); },
    sendStatus(code: number) {
      _statusCode.value = code;
      this.end();
    },
    locals: {},
  };

  try {
    const handler = getHandler();
    await handler!(nodeReq, nodeRes);
  } catch (err: any) {
    console.error("[API Bridge] Error:", err.message);
    statusCode = 500;
    resHeaders = { "content-type": "application/json" };
    chunks.length = 0;
    chunks.push(Buffer.from(JSON.stringify({ error: "Internal Server Error" })));
  }

  const bodyOut = Buffer.concat(chunks);
  const responseHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(resHeaders)) {
    if (k !== "transfer-encoding" && k !== "content-length") {
      responseHeaders[k] = v;
    }
  }
  responseHeaders["content-length"] = String(bodyOut.length);

  return new NextResponse(bodyOut, {
    status: statusCode,
    headers: responseHeaders,
  });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const OPTIONS = handleRequest;
export const HEAD = handleRequest;
