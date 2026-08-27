/**
 * Next.js App Router catch-all that bridges to the Express serverless function.
 */
import { NextRequest, NextResponse } from "next/server";
import { Readable } from "node:stream";

let expressHandler: ((req: any, res: any) => any) | null = null;

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

  // Build headers
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  // Build Node.js IncomingMessage-like object
  const readable = new Readable({
    read() {
      if (body) this.push(body);
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

  // Build response collector — wraps in Promise that resolves on end()
  return new Promise<NextResponse>((resolve) => {
    const chunks: Buffer[] = [];
    let _statusCode = 200;
    const _headers: Record<string, string> = {};

    const nodeRes: any = {
      statusCode: 200,
      headersSent: false,

      setHeader(name: string, value: string | string[]) {
        _headers[name.toLowerCase()] = Array.isArray(value)
          ? value.join(", ")
          : String(value);
      },
      getHeader(name: string) {
        return _headers[name.toLowerCase()];
      },
      removeHeader(name: string) {
        delete _headers[name.toLowerCase()];
      },
      writeHead(code: number, hdrs?: Record<string, string>) {
        _statusCode = code;
        if (hdrs) Object.assign(_headers, hdrs);
        return this;
      },
      write(chunk: string | Buffer) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      end(chunk?: string | Buffer) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        this.headersSent = true;
        _statusCode = this.statusCode;

        const bodyOut = Buffer.concat(chunks);
        const responseHeaders: Record<string, string> = {};
        for (const [k, v] of Object.entries(_headers)) {
          if (k !== "transfer-encoding" && k !== "content-length") {
            responseHeaders[k] = v;
          }
        }
        responseHeaders["content-length"] = String(bodyOut.length);
        if (!responseHeaders["content-type"]) {
          responseHeaders["content-type"] = "application/octet-stream";
        }

        resolve(new NextResponse(bodyOut, {
          status: _statusCode,
          headers: responseHeaders,
        }));
      },

      // Express uses these
      status(code: number) { this.statusCode = code; return this; },
      send(data: any) {
        if (typeof data === "string") this.write(data);
        else if (Buffer.isBuffer(data)) this.write(data);
        else this.write(String(data));
        this.end();
      },
      json(data: any) {
        this.setHeader("content-type", "application/json");
        this.write(JSON.stringify(data));
        this.end();
      },
      redirect(...args: any[]) {
        const target = typeof args[1] === "string" ? args[1] : args[0];
        this.setHeader("location", target);
        this.statusCode = typeof args[0] === "number" ? args[0] : 302;
        this.end();
      },
      sendStatus(code: number) { this.statusCode = code; this.end(); },
      set(name: string, value: string | string[]) { this.setHeader(name, value); },
      append(name: string, value: string | string[]) {
        const existing = _headers[name.toLowerCase()];
        const newVal = Array.isArray(value) ? value.join(", ") : String(value);
        _headers[name.toLowerCase()] = existing ? existing + ", " + newVal : newVal;
      },
      type(type: string) { this.setHeader("content-type", type); },
      format(obj: any) { const type = this.get?.("content-type") || "application/octet-stream"; if (obj[type]) obj[type](); else if (obj.default) obj.default(); return this; },
      get(name: string) { return this.getHeader(name); },
      cookie() { return this; },
      locals: {},
    };

    try {
      const handler = getHandler()!;
      const result = handler(nodeReq, nodeRes);
      // If handler returns a Promise, catch errors
      if (result && typeof result.catch === "function") {
        result.catch((err: any) => {
          console.error("[API Bridge] Async error:", err.message);
          chunks.length = 0;
          _headers["content-type"] = "application/json";
          chunks.push(Buffer.from(JSON.stringify({ error: "Internal Server Error", detail: err.message })));
          nodeRes.statusCode = 500;
          nodeRes.end();
        });
      }
    } catch (err: any) {
      console.error("[API Bridge] Sync error:", err.message, err.stack);
      chunks.length = 0;
      _headers["content-type"] = "application/json";
      chunks.push(Buffer.from(JSON.stringify({ error: "Internal Server Error", detail: err.message })));
      nodeRes.statusCode = 500;
      nodeRes.end();
    }

    // Timeout fallback — if Express never calls end(), resolve after 25s
    setTimeout(() => {
      if (chunks.length === 0) {
        chunks.push(Buffer.from(JSON.stringify({ error: "Gateway Timeout" })));
        _headers["content-type"] = "application/json";
      }
      resolve(new NextResponse(Buffer.concat(chunks), {
        status: _statusCode || 504,
        headers: { ..._headers, "content-length": String(Buffer.concat(chunks).length) },
      }));
    }, 25000);
  });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
export const PATCH = handleRequest;
export const OPTIONS = handleRequest;
export const HEAD = handleRequest;
