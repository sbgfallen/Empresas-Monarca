/**
 * Next.js App Router catch-all that bridges to the Express serverless function.
 */
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

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
    const parts = c.trim().split("=");
    if (parts.length >= 2) {
      cookies[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join("="));
    }
  });

  // Build full headers object (Express expects lowercase)
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Build Node.js IncomingMessage-like object
  const readable = new Readable({
    read() {
      if (body) {
        this.push(body);
      }
      this.push(null);
    },
  });

  const nodeReq = Object.assign(readable, {
    method: request.method,
    url: apiPath + url.search,
    originalUrl: apiPath + url.search,
    headers,
    httpVersion: "1.1",
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    socket: { remoteAddress: "127.0.0.1" },
    cookies,
    get connection() { return this.socket; },
  });

  // Collect response
  const chunks: Buffer[] = [];
  let statusCode = 200;
  let resHeaders: Record<string, string> = {};

  const nodeRes: any = {
    statusCode: 200,
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
      this.statusCode = code;
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
      statusCode = this.statusCode;
      resHeaders = { ...this._headers };
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: any) {
      const json = JSON.stringify(data);
      this.setHeader("content-type", "application/json");
      this.write(json);
      this.end();
    },
    cookie() { return this; },
    redirect() { this.end(); },
    sendStatus(code: number) {
      this.statusCode = code;
      this.end();
    },
    send(data: string | Buffer) {
      if (typeof data === "string") {
        this.write(data);
      } else {
        this.write(data);
      }
      this.end();
    },
    locals: {},
  };

  try {
    const handler = getHandler();
    await handler!(nodeReq, nodeRes);
  } catch (err: any) {
    console.error("[API Bridge] Error:", err.message, err.stack);
    statusCode = 500;
    resHeaders = { "content-type": "application/json" };
    chunks.length = 0;
    chunks.push(Buffer.from(JSON.stringify({ error: "Internal Server Error", detail: err.message })));
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
