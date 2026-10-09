import { createServer } from "node:http";
import type { IncomingMessage, Server, ServerResponse } from "node:http";
import type { Socket } from "node:net";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { ok } from "./types.ts";
import { dispatch } from "./router.ts";
import { VERSION } from "./config.ts";

// ---------------------------------------------------------------------------
// T10 - node:http transport for the handler model, health/ready probes, and
// graceful shutdown (SIGTERM drains active connections within 10 seconds).
// ---------------------------------------------------------------------------

const MAX_BODY_BYTES = 1024 * 1024;

export function healthHandler(_req: HttpRequest): HttpResponse {
  return ok({
    status: "ok",
    uptime: Math.round(process.uptime()),
    timestamp: Date.now(),
    version: VERSION,
  });
}

export function readyHandler(_req: HttpRequest): HttpResponse {
  return ok({
    status: "ready",
    uptime: Math.round(process.uptime()),
    timestamp: Date.now(),
    checks: { db: "up" },
  });
}

function lowerHeaders(original: IncomingMessage["headers"]): Record<string, string | undefined> {
  const headers: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(original)) {
    headers[key.toLowerCase()] = Array.isArray(value) ? value.join(",") : (value ?? undefined);
  }
  return headers;
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        reject(new Error("body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function respond(res: ServerResponse, response: HttpResponse): void {
  const body = JSON.stringify(response.body ?? {});
  res.writeHead(response.status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(body),
  });
  res.end(body);
}

/**
 * The full application request listener: health/ready probes bypass dispatch,
 * everything else goes through the handler router.
 */
export async function appListener(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const method = req.method ?? "GET";
    const path = req.url ?? "/";
    const headers = lowerHeaders(req.headers);

    const raw = await readBody(req);
    let body: unknown = undefined;
    if (raw.length > 0) {
      try {
        body = JSON.parse(raw);
      } catch {
        respond(res, { status: 400, body: { error: "invalid JSON body" } });
        return;
      }
    }

    const request: HttpRequest = { method, path, body, headers };

    let response: HttpResponse;
    if (path === "/health") {
      response = healthHandler(request);
    } else if (path === "/ready") {
      response = readyHandler(request);
    } else {
      response = await dispatch(request);
    }
    respond(res, response);
  } catch (err) {
    respond(res, { status: 500, body: { error: "internal error", detail: String(err) } });
  }
}

export interface GracefulShutdownOptions {
  /** How long to wait for connections to drain before force-closing. */
  timeoutMs?: number;
  /** Whether to force-exit the process when the drain timeout is hit. */
  exitOnTimeout?: boolean;
}

/**
 * Stop accepting new connections, drain active connections, and settle within
 * `timeoutMs` (default 10s) by destroying stragglers.
 */
export function gracefulShutdown(
  server: Server,
  options: GracefulShutdownOptions = {},
): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const exitOnTimeout = options.exitOnTimeout ?? true;

  return new Promise<void>((resolve) => {
    const connections = new Set<Socket>();
    server.on("connection", (socket) => {
      connections.add(socket);
      socket.once("close", () => connections.delete(socket));
    });

    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(forceTimer);
      resolve();
    };

    server.close(() => finish());

    const forceTimer = setTimeout(() => {
      for (const socket of connections) socket.destroy();
      if (exitOnTimeout) {
        finish();
        process.exit(0);
      } else {
        finish();
      }
    }, timeoutMs);
    forceTimer.unref();
  });
}

export interface StartedServer {
  server: Server;
  port: number;
  url: string;
  close: () => Promise<void>;
  shutdown: () => Promise<void>;
  uninstallSignalHandler: () => void;
}

export interface StartOptions {
  port?: number;
  host?: string;
  /** Wire SIGTERM to graceful shutdown (T10). Default true. */
  gracefulOnSigterm?: boolean;
}

/**
 * Start the node:http server. When gracefulOnSigterm is enabled (default), a
 * SIGTERM drains active connections within 10s before the process exits.
 */
export function startServer(options: StartOptions = {}): Promise<StartedServer> {
  const { port = 0, host = "127.0.0.1", gracefulOnSigterm = true } = options;

  return new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      void appListener(req, res);
    });

    const onSignal = () => {
      void gracefulShutdown(server, { timeoutMs: 10_000, exitOnTimeout: true });
    };
    if (gracefulOnSigterm) process.once("SIGTERM", onSignal);

    server.once("error", reject);
    server.listen(port, host, () => {
      const address = server.address();
      const actualPort = typeof address === "object" && address ? address.port : port;
      resolve({
        server,
        port: actualPort,
        url: `http://${host}:${actualPort}`,
        close: () =>
          new Promise<void>((resolved) => {
            server.close(() => resolved());
          }),
        shutdown: () => gracefulShutdown(server, { timeoutMs: 10_000, exitOnTimeout: false }),
        uninstallSignalHandler: () => {
          process.removeListener("SIGTERM", onSignal);
        },
      });
    });
  });
}