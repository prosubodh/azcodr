import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { connect } from "node:net";
import { startServer, gracefulShutdown } from "../src/http.ts";
import type { StartedServer } from "../src/http.ts";
import { httpJson, resetDb } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

async function withServer(
  t: { after: (fn: () => unknown) => void },
  fn: (started: StartedServer) => Promise<void>,
): Promise<void> {
  const started = await startServer({ port: 0, host: "127.0.0.1" });
  t.after(() => {
    started.uninstallSignalHandler();
  });
  t.after(async () => {
    await started.close().catch(() => undefined);
  });
  return fn(started);
}

test("T10: /health returns 200 with status ok and uptime", async (t) => {
  await withServer(t, async (started) => {
    const res = await httpJson("GET", `${started.url}/health`);
    assert.equal(res.status, 200);
    const body = res.body as Record<string, unknown>;
    assert.equal(body.status, "ok");
    assert.equal(typeof body.uptime, "number");
    assert.equal(typeof body.timestamp, "number");
  });
});

test("T10: /ready returns 200 with status ready and checks", async (t) => {
  await withServer(t, async (started) => {
    const res = await httpJson("GET", `${started.url}/ready`);
    assert.equal(res.status, 200);
    const body = res.body as Record<string, unknown>;
    assert.equal(body.status, "ready");
    assert.ok((body.checks as Record<string, unknown>).db);
  });
});

test("T10: the node:http server serves the full API flow end to end", async (t) => {
  await withServer(t, async (started) => {
    // register + login over real HTTP
    const reg = await httpJson("POST", `${started.url}/api/auth/register`, {
      email: "http@example.com",
      password: "password-123",
    });
    assert.equal(reg.status, 201);

    const login = await httpJson("POST", `${started.url}/api/auth/login`, {
      email: "http@example.com",
      password: "password-123",
    });
    assert.equal(login.status, 200);
    const token = (login.body as { token: string }).token;

    // create + list workspace over real HTTP
    const create = await httpJson(
      "POST",
      `${started.url}/api/workspaces`,
      { name: "HTTP Co" },
      { authorization: `Bearer ${token}` },
    );
    assert.equal(create.status, 201);

    const list = await httpJson("GET", `${started.url}/api/workspaces`, undefined, {
      authorization: `Bearer ${token}`,
    });
    assert.equal(list.status, 200);
    assert.equal((list.body as { workspaces: unknown[] }).workspaces.length, 1);

    // unknown routes 404
    const missing = await httpJson("GET", `${started.url}/api/does-not-exist`);
    assert.equal(missing.status, 404);
  });
});

test("T10: malformed JSON bodies are rejected with 400", async (t) => {
  await withServer(t, async (started) => {
    const { request } = await import("node:http");
    const res = await new Promise<{ status: number }>((resolve, reject) => {
      const parsed = new URL(`${started.url}/api/auth/register`);
      const clientReq = request(
        {
          hostname: parsed.hostname,
          port: parsed.port,
          path: parsed.pathname,
          method: "POST",
          headers: { "content-type": "application/json" },
          agent: false,
        },
        (incoming) => {
          incoming.resume();
          incoming.on("end", () => resolve({ status: incoming.statusCode ?? 0 }));
        },
      );
      clientReq.on("error", reject);
      clientReq.write("{not-json");
      clientReq.end();
    });
    assert.equal(res.status, 400);
  });
});

test("T10: graceful shutdown drains active connections within 10s", async (t) => {
  const started = await startServer({ port: 0, host: "127.0.0.1", gracefulOnSigterm: false });
  t.after(() => {
    started.uninstallSignalHandler();
  });

  const health = await httpJson("GET", `${started.url}/health`);
  assert.equal(health.status, 200);

  // Keep one raw connection open so the server cannot finish closing.
  const socket = connect(started.port, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    socket.once("connect", () => resolve());
    socket.once("error", reject);
  });

  const began = Date.now();
  const shutdownPromise = started.shutdown();
  await new Promise((r) => setTimeout(r, 100));

  // With the socket still open, the server must not have closed yet.
  assert.equal(socket.destroyed, false);

  // Release the connection -> drain completes well inside the 10s budget.
  socket.destroy();
  await shutdownPromise;
  assert.ok(Date.now() - began < 10_000, "drain finished within 10s");

  // The server is no longer accepting new connections.
  await assert.rejects(() => httpJson("GET", `${started.url}/health`));
});

test("T10: SIGTERM triggers graceful shutdown of the node:http server", async (t) => {
  const started = await startServer({ port: 0, host: "127.0.0.1" });
  t.after(() => {
    started.uninstallSignalHandler();
  });

  const health = await httpJson("GET", `${started.url}/health`);
  assert.equal(health.status, 200);

  const closed = new Promise<void>((resolve) => {
    started.server.once("close", () => resolve());
  });

  process.emit("SIGTERM");
  await closed;

  // New connections are refused after the SIGTERM drain.
  await assert.rejects(() => httpJson("GET", `${started.url}/health`));
});

test("T10: gracefulShutdown resolves immediately with no connections", async () => {
  const server = (await import("node:http")).createServer((_req, res) => res.end("ok"));
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  try {
    const before = Date.now();
    await gracefulShutdown(server, { exitOnTimeout: false });
    assert.ok(Date.now() - before < 5_000);
  } finally {
    server.close();
  }
});