import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { db, publishEvent, processOutbox, pendingEvents, type Tx } from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

const EVENT = {
  aggregateType: "account",
  aggregateId: "acc-1",
  type: "account.created",
  payload: { email: "new@example.com" },
};

test("T06: events published in a transaction are persisted atomically with the change", () => {
  let committedEventId: string | undefined;
  db.withTransaction((tx: Tx) => {
    tx.insert("accounts", { id: "acc-1", email: "new@example.com", createdAt: new Date().toISOString() });
    publishEvent(tx, EVENT);
  });

  assert.equal(db.count("accounts"), 1, "entity change committed");
  const pending = pendingEvents();
  assert.equal(pending.length, 1, "event persisted with the same commit");
  assert.equal(pending[0].type, EVENT.type);
  assert.equal(pending[0].aggregateId, "acc-1");
  committedEventId = pending[0].id;
  assert.ok(committedEventId);
});

test("T06: a rolled-back transaction persists neither the change nor the event", () => {
  let txId = "tx-rollback";
  void txId;
  assert.throws(() => {
    db.withTransaction((tx: Tx) => {
      tx.insert("accounts", { id: "acc-bad", email: "bad@example.com", createdAt: new Date().toISOString() });
      publishEvent(tx, { ...EVENT, aggregateId: "acc-bad" });
      throw new Error("boom");
    });
  }, /boom/);

  assert.equal(db.count("accounts"), 0, "entity change rolled back");
  assert.equal(db.count("outboxEvents"), 0, "event rolled back with the transaction");
});

test("T06: outbox worker delivers pending events and marks them sent", async () => {
  db.withTransaction((tx: Tx) => {
    tx.insert("accounts", { id: "acc-1", email: "new@example.com", createdAt: new Date().toISOString() });
    publishEvent(tx, { ...EVENT, aggregateId: "acc-1" });
    publishEvent(tx, { aggregateType: "account", aggregateId: "acc-1", type: "account.verified", payload: {} });
  });

  const received: Array<{ type: string; payload: Record<string, unknown> }> = [];
  const result = await processOutbox(async (event) => {
    received.push({ type: event.type, payload: event.payload });
  });

  assert.deepEqual(
    result.delivered.map((e) => e.type),
    ["account.created", "account.verified"],
    "FIFO delivery order",
  );
  assert.equal(result.remainingPending, 0);
  assert.equal(received.length, 2);
  assert.equal(received[0].type, "account.created");
  assert.deepEqual(received[0].payload, { email: "new@example.com" });

  const rows = db.findAll("outboxEvents") as any[];
  assert.ok(rows.every((r) => r.status === "sent"), "all events marked sent");
  assert.ok(rows.every((r) => typeof r.sentAt === "string"), "sentAt stamped");
});

test("T06: worker is idempotent — a second pass delivers nothing new", async () => {
  db.withTransaction((tx: Tx) => {
    publishEvent(tx, EVENT);
  });

  const first = await processOutbox(async () => {});
  assert.equal(first.delivered.length, 1);

  const second = await processOutbox(async () => {});
  assert.equal(second.delivered.length, 0);
});