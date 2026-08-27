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

  let body: Buffer | undefined;
  if (request.body) {
    const ab = await request.arrayBuffer();
    body = Buffer.from(ab);
  }

  const cookieHeader = request.headers.get("cookie") || "";
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((c) => {
    const parts = c.trim().split("=");
    if (parts.length >= 2) {
      cookies[decodeURIComponent(parts[0])] = decodeURIComponent(parts.slice(1).join("="));
    }
  });

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

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

  return new Promise<NextResponse>((resolve) => {
    const chunks: Buffer[] = [];
    let _statusCode = 200;
    const _headers: Record<string, string> = {};
    let resolved = false;

    function finalize() {
      if (resolved) return;
      resolved = true;
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
      console.log(`[API Bridge] ${apiPath} → ${_statusCode} (${bodyOut.length} bytes)`);
      resolve(new NextResponse(bodyOut, { status: _statusCode, headers: responseHeaders }));
    }

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
        const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
        chunks.push(buf);
        return true;
      },
      end(chunk?: string | Buffer) {
        if (chunk) {
          const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          chunks.push(buf);
        }
        _statusCode = this.statusCode || _statusCode;
        finalize();
      },

      status(code: number) { this.statusCode = code; return this; },
      send(data: any) {
        if (data !== undefined && data !== null) {
          if (typeof data === "string") this.write(data);
          else if (Buffer.isBuffer(data)) this.write(data);
          else this.write(String(data));
        }
        this.end();
      },
      json(data: any) {
        _headers["content-type"] = _headers["content-type"] || "application/json";
        this.write(JSON.stringify(data));
        this.end();
      },
      redirect(...args: any[]) {
        const target = typeof args[1] === "string" ? args[1] : args[0];
        _headers["location"] = target;
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
      type(type: string) { _headers["content-type"] = type; },
      get(name: string) { return this.getHeader(name); },
      cookie() { return this; },
      locals: {},
    };

    try {
      const handler = getHandler()!;
      console.log(`[API Bridge] Calling handler for ${apiPath}`);
      const result = handler(nodeReq, nodeRes);
      if (result && typeof result.catch === "function") {
        result.catch((err: any) => {
          console.error("[API Bridge] Async error:", err.message);
          if (!resolved) {
            chunks.length = 0;
            _headers["content-type"] = "application/json";
            chunks.push(Buffer.from(JSON.stringify({ error: "Internal Server Error", detail: err.message })));
            _statusCode = 500;
            finalize();
          }
        });
      }
    } catch (err: any) {
      console.error("[API Bridge] Sync error:", err.message);
      if (!resolved) {
        chunks.length = 0;
        _headers["content-type"] = "application/json";
        chunks.push(Buffer.from(JSON.stringify({ error: "Internal Server Error", detail: err.message })));
        _statusCode = 500;
        finalize();
      }
    }

    setTimeout(() => {
      if (!resolved) {
        console.log(`[API Bridge] Timeout for ${apiPath}`);
        _headers["content-type"] = "application/json";
        chunks.push(Buffer.from(JSON.stringify({ error: "Gateway Timeout" })));
        finalize();
      }
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
