import { test } from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import { startServer, routeRequest, type RunningServer } from "../src/index.ts";

function request(port: number, method: string, path: string, body?: unknown): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const payload = body !== undefined ? JSON.stringify(body) : undefined;
    const req = http.request(
      {
        host: "127.0.0.1",
        port,
        path,
        method,
        headers: payload ? { "content-type": "application/json" } : undefined,
      },
      (res) => {
        let data = "";
        res.on("data", (c: Buffer) => {
          data += c.toString("utf8");
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, body: data }));
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function withServer(run: (srv: RunningServer) => Promise<void>): Promise<void> {
  const srv = await startServer(0);
  try {
    await run(srv);
  } finally {
    await srv.stop();
  }
}

test("T10: /health returns 200 OK with uptime and status over a real node:http server", async () => {
  await withServer(async (srv) => {
    const res = await request(srv.port, "GET", "/health");
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, "ok");
    assert.equal(typeof body.uptime, "number");
    assert.ok(body.uptime >= 0);
    assert.ok(typeof body.timestamp === "string");
  });
});

test("T10: /ready returns 200 with readiness info", async () => {
  await withServer(async (srv) => {
    const res = await request(srv.port, "GET", "/ready");
    assert.equal(res.status, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.status, "ready");
    assert.equal(body.checks.db, "ok");
  });
});

test("T10: unknown routes return 404 over the wire", async () => {
  await withServer(async (srv) => {
    const res = await request(srv.port, "GET", "/nope");
    assert.equal(res.status, 404);
  });
});

test("T10: the app routes work end-to-end through the real server (register + workspace)", async () => {
  await withServer(async (srv) => {
    const reg = await request(srv.port, "POST", "/api/auth/register", {
      email: "wire@example.com",
      password: "wiretestpass1",
    });
    assert.equal(reg.status, 201);

    const four = await request(srv.port, "GET", "/api/workspaces");
    assert.equal(four.status, 401, "authenticated routes are enforced on the wire too");
  });
});

test("T10: graceful shutdown — SIGTERM drains and closes the server within 10s", async () => {
  const srv = await startServer(0);

  const closed = new Promise<void>((resolve) => srv.server.on("close", () => resolve()));

  // Emitting SIGTERM triggers the same handlers a real signal would.
  process.emit("SIGTERM");

  const timedOut = await new Promise<boolean>((resolve) => {
    const t = setTimeout(() => resolve(true), 10_000);
    closed.then(() => {
      clearTimeout(t);
      resolve(false);
    });
  });
  assert.equal(timedOut, false, "server closed within the 10s drain window");

  // The port is no longer accepting connections.
  await assert.rejects(() => request(srv.port, "GET", "/health"));
  await srv.stop();
});