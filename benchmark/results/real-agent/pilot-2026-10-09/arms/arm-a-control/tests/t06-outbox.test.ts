import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/db.ts";
import { register } from "../src/auth.ts";
import {
  pendingCount,
  processOutbox,
  publishOutboxEvent,
  subscribeOutbox,
} from "../src/outbox.ts";
import { req, expectStatus, resetDb } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

test("T06: domain events persist atomically with the domain write", () => {
  register(req("POST", "/api/auth/register", { email: "eve@example.com", password: "password-123" }));

  // One pending outbox event alongside the user row, plus the event exists.
  assert.equal(pendingCount(), 1);
  const events = [...db.outbox.values()];
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "user.registered");
  assert.equal(events[0].status, "pending");
  assert.equal(events[0].deliveredAt, null);
  assert.equal(db.users.size, 1);
});

test("T06: a failed transaction rolls back both the domain write and the outbox event", () => {
  const before = pendingCount();
  assert.throws(() => {
    db.transaction(() => {
      db.users.set("u-fail", {
        id: "u-fail",
        email: "fail@example.com",
        passwordHash: null,
        oauthProvider: null,
        oauthSubject: null,
        createdAt: Date.now(),
      });
      publishOutboxEvent("order.created", "u-fail", { reason: "boom" });
      throw new Error("replicate a downstream failure");
    });
  }, /replicate a downstream failure/);

  // Nothing leaked: no user, no outbox row.
  assert.equal(db.users.has("u-fail"), false);
  assert.equal(pendingCount(), before);
  assert.deepEqual([...db.outbox.values()].filter((e) => e.aggregateId === "u-fail"), []);
});

test("T06: a committed transaction keeps both the write and its event", () => {
  db.transaction(() => {
    db.users.set("u-ok", {
      id: "u-ok",
      email: "ok@example.com",
      passwordHash: null,
      oauthProvider: null,
      oauthSubject: null,
      createdAt: Date.now(),
    });
    publishOutboxEvent("user.registered", "u-ok", { email: "ok@example.com" });
  });

  assert.equal(db.users.has("u-ok"), true);
  assert.equal(pendingCount(), 1);
});

test("T06: the outbox worker delivers pending events and marks them sent", () => {
  register(req("POST", "/api/auth/register", { email: "worker@example.com", password: "password-123" }));
  register(req("POST", "/api/auth/register", { email: "worker2@example.com", password: "password-123" }));
  assert.equal(pendingCount(), 2);

  const delivered: string[] = [];
  const unsubscribe = subscribeOutbox((event) => {
    delivered.push(event.type);
  });
  try {
    const result = expectOkResult(processOutbox());
    assert.equal(result.delivered, 2);
    assert.equal(result.pending, 0);
    assert.deepEqual(delivered.sort(), ["user.registered", "user.registered"]);

    for (const row of db.outbox.values()) {
      assert.equal(row.status, "sent");
      assert.ok(row.deliveredAt, "deliveredAt is set");
    }
  } finally {
    unsubscribe();
  }

  // Idempotent: no pending events remain to redeliver.
  assert.equal(expectOkResult(processOutbox()).delivered, 0);

  function expectOkResult(res: { status: number; body: unknown }) {
    if (res.status !== 200) throw new Error(`expected 200, got ${res.status}`);
    return res.body as { delivered: number; pending: number };
  }
});