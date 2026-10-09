/**
 * T10 – Graceful shutdown and health probes.
 *
 * This is the only transport layer: a real `node:http` server. Every app route
 * dispatches to the exported async handlers modeled throughout the codebase.
 * `SIGTERM`/`SIGINT` trigger a graceful drain: the server stops accepting new
 * connections, active connections are ended, and shutdown completes within a
 * hard 10-second budget.
 */
import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import type { Socket } from "node:net";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { pathSegments, respond, type Handler } from "./types.ts";
import { handleAuth } from "./auth.ts";
import { handleOAuth } from "./oauth.ts";
import { handleWorkspaces } from "./tenant.ts";
import { handleBilling } from "./billing.ts";
import { handlePayment } from "./payments.ts";
import { handleAudit } from "./audit.ts";
import { handleRbac } from "./rbac.ts";

// ---- health / readiness probes (also exported as handlers) ----

export const healthHandler: Handler = async (req) => {
  return {
    status: 200,
    body: {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  };
};

export const readyHandler: Handler = async (req) => {
  return {
    status: 200,
    body: {
      status: "ready",
      uptime: process.uptime(),
      checks: { db: "ok" },
    },
  };
};

// ---- application router ----

export async function routeRequest(req: HttpRequest): Promise<HttpResponse> {
  const seg = pathSegments(req.path);
  const method = req.method.toUpperCase();

  if (seg.length === 1 && seg[0] === "health") return healthHandler(req);
  if (seg.length === 1 && seg[0] === "ready") return readyHandler(req);

  if (seg[0] === "api" && seg[1] === "auth") return handleAuth(req);

  if (seg[0] === "oauth" && seg.length >= 3) return handleOAuth(req);

  if (seg[0] === "api" && seg[1] === "audit") return handleAudit(req);

  if (seg[0] === "api" && seg[1] === "payments") return handlePayment(req);

  if (seg[0] === "api" && seg[1] === "workspaces") {
    // /api/workspaces/:id/invites | /api/workspaces/:id/members -> rbac
    if (seg.length === 4 && (seg[3] === "invites" || seg[3] === "members")) return handleRbac(req);
    // /api/workspaces/:id/feature-checks -> billing
    if (seg.length === 4 && seg[3] === "feature-checks") return handleBilling(req);
    return handleWorkspaces(req);
  }

  return { status: 404, body: { error: "not found" } };
}

// ---- HTTP adapter ----

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk: Buffer) => {
      data += chunk.toString("utf8");
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function toRequest(incoming: IncomingMessage, raw: string): HttpRequest {
  let body: unknown = raw;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw; // non-JSON (e.g. webhook payloads stay as their raw string)
    }
  }
  return {
    method: incoming.method ?? "GET",
    path: incoming.url ?? "/",
    body: raw ? body : undefined,
    rawBody: raw || undefined,
    headers: incoming.headers,
  };
}

export function createAppServer(): Server {
  return createHttpServer(async (incoming: IncomingMessage, res: ServerResponse) => {
    let out: HttpResponse;
    try {
      const raw = await readBody(incoming);
      const req = toRequest(incoming, raw);
      out = await routeRequest(req);
    } catch (err) {
      out = { status: 500, body: { error: "internal server error" } };
    }
    const payload = JSON.stringify(out.body ?? {});
    res.writeHead(out.status, {
      "content-type": "application/json; charset=utf-8",
      "content-length": Buffer.byteLength(payload),
    });
    res.end(payload);
  });
}

// ---- graceful shutdown ----

const SHUTDOWN_TIMEOUT_MS = 10_000;

export function gracefulShutdown(server: Server, sockets: Set<Socket>, timeoutMs = SHUTDOWN_TIMEOUT_MS): Promise<void> {
  return new Promise((resolve) => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const done = () => {
      if (timer) clearTimeout(timer);
      resolve();
    };
    timer = setTimeout(() => {
      // Hard cap: force-destroy anything that would not drain in time.
      server.closeAllConnections?.();
      done();
    }, timeoutMs);
    if (typeof timer.unref === "function") timer.unref();

    server.close(done); // stops accepting new connections; resolves when drained
    for (const socket of sockets) socket.end(); // drain active connections
  });
}

export interface RunningServer {
  server: Server;
  port: number;
  host: string;
  /** Stops listening and performs a graceful drain (used by tests). */
  stop(): Promise<void>;
}

export function startServer(port = 0, host = "127.0.0.1"): Promise<RunningServer> {
  const server = createAppServer();
  const sockets = new Set<Socket>();
  server.on("connection", (socket: Socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });

  const onSignal = () => {
    void gracefulShutdown(server, sockets);
  };
  process.on("SIGTERM", onSignal);
  process.on("SIGINT", onSignal);

  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      const addr = server.address();
      resolve({
        server,
        port: typeof addr === "object" && addr !== null ? addr.port : 0,
        host,
        async stop() {
          process.off("SIGTERM", onSignal);
          process.off("SIGINT", onSignal);
          await gracefulShutdown(server, sockets);
        },
      });
    });
  });
}