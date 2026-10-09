import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { HttpHandler, HttpResponse } from './endpoint.ts';

export interface HealthOptions {
  readonly isReady: () => boolean;
}

export interface HealthHandlers {
  readonly health: HttpHandler;
  readonly ready: HttpHandler;
}

/** /health + /ready as canonical endpoint handlers (transport contract). */
export function createHealthHandlers(options: HealthOptions): HealthHandlers {
  return {
    health: async () => ({ status: 200, body: { status: 'ok' } }),
    ready: async () =>
      options.isReady()
        ? { status: 200, body: { status: 'ready' } }
        : { status: 503, body: { status: 'not ready' } }
  };
}

/**
 * node:http API surface (T10). Routes /health and /ready to the canonical
 * handlers; the app server wraps these same handlers behind auth later. No
 * third-party runtime dependencies — node:http only.
 */
export function createApiServer(options: HealthOptions): Server {
  const handlers = createHealthHandlers(options);
  return createServer((req, res) => {
    void dispatch(req, res, handlers);
  });
}

async function dispatch(req: IncomingMessage, res: ServerResponse, handlers: HealthHandlers): Promise<void> {
  const method = req.method ?? 'GET';
  const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
  try {
    let response: HttpResponse;
    if (method === 'GET' && pathname === '/health') {
      response = await handlers.health({ method, path: pathname, headers: {} });
    } else if (method === 'GET' && pathname === '/ready') {
      response = await handlers.ready({ method, path: pathname, headers: {} });
    } else {
      response = { status: 404, body: { code: 'NOT_FOUND', detail: 'Unknown endpoint.' } };
    }
    writeJson(res, response.status, response.body);
  } catch {
    writeJson(res, 500, { status: 500, title: 'Internal Server Error' });
  }
}

function writeJson(res: ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json',
    'content-length': Buffer.byteLength(payload)
  });
  res.end(payload);
}

export interface ShutdownOptions {
  readonly timeoutMs?: number;
}

/**
 * Graceful drain: stop accepting new connections, let in-flight work finish,
 * and force-close stragglers once the grace period elapses — so a SIGTERM
 * drain is bounded (default 10s). Resolves once the server has closed.
 */
export async function shutdownServer(server: Server, options: ShutdownOptions = {}): Promise<void> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  if (!server.listening) return;
  await new Promise<void>((resolve) => {
    let settled = false;
    const finish = (): void => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        resolve();
      }
    };
    const timer = setTimeout(() => {
      server.closeAllConnections();
      finish();
    }, timeoutMs);
    server.once('close', finish);
    server.close(() => finish());
    server.closeIdleConnections();
  });
}

/** Wires SIGTERM/SIGINT to a graceful drain then exit (Windows: SIGINT only). */
export function registerGracefulShutdown(server: Server, options: ShutdownOptions = {}): () => void {
  const shutdown = (): void => {
    void shutdownServer(server, options).then(() => process.exit(0));
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
  return () => {
    process.removeListener('SIGTERM', shutdown);
    process.removeListener('SIGINT', shutdown);
  };
}