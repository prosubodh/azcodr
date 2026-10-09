import { db, newId } from "./db.ts";
import type { OutboxRow } from "./db.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { ok } from "./types.ts";
import { OUTBOX_BATCH_SIZE } from "./config.ts";

// ---------------------------------------------------------------------------
// Transactional outbox (T06).
//
// Domain mutations publish events with publishOutboxEvent() - call it INSIDE a
// db.transaction(...) so the domain write and the outbox row commit together
// (or roll back together). A background worker (processOutbox) later delivers
// pending events to subscribers and marks them sent.
// ---------------------------------------------------------------------------

export interface OutboxEvent {
  id: string;
  type: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent";
  createdAt: number;
  deliveredAt: number | null;
}

export type OutboxHandler = (event: OutboxEvent) => void;

const subscribers = new Set<OutboxHandler>();

/** Register a delivery handler for outbox events. Returns an unsubscribe fn. */
export function subscribeOutbox(handler: OutboxHandler): () => void {
  subscribers.add(handler);
  return () => {
    subscribers.delete(handler);
  };
}

/**
 * Insert a pending outbox event. Must be called inside db.transaction() so it
 * commits atomically with the domain write that produced it.
 */
export function publishOutboxEvent(
  type: string,
  aggregateId: string,
  payload: Record<string, unknown>,
): void {
  const id = newId();
  db.outbox.set(id, {
    id,
    type,
    aggregateId,
    payload: JSON.stringify(payload),
    status: "pending",
    createdAt: Date.now(),
    deliveredAt: null,
  });
}

function toEvent(row: OutboxRow): OutboxEvent {
  return {
    id: row.id,
    type: row.type,
    aggregateId: row.aggregateId,
    payload: JSON.parse(row.payload) as Record<string, unknown>,
    status: row.status,
    createdAt: row.createdAt,
    deliveredAt: row.deliveredAt,
  };
}

/** Number of events still waiting to be delivered. */
export function pendingCount(): number {
  let count = 0;
  for (const row of db.outbox.values()) {
    if (row.status === "pending") count += 1;
  }
  return count;
}

/**
 * Outbox worker: delivers pending events (oldest first) to subscribers and
 * marks them sent. Exposed as an endpoint (POST /api/outbox/process) so it can
 * also be triggered on demand; a timer wrapper starts a background loop.
 */
export function processOutbox(_req?: HttpRequest): HttpResponse {
  const pending = [...db.outbox.values()]
    .filter((row) => row.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id))
    .slice(0, OUTBOX_BATCH_SIZE);

  const delivered: OutboxEvent[] = [];
  for (const row of pending) {
    const event = toEvent(row);
    for (const handler of subscribers) {
      try {
        handler(event);
      } catch {
        // Delivery errors are intentionally swallowed: the queue keeps moving.
      }
    }
    db.outbox.set(event.id, {
      id: event.id,
      type: event.type,
      aggregateId: event.aggregateId,
      payload: JSON.stringify(event.payload),
      status: "sent",
      createdAt: event.createdAt,
      deliveredAt: Date.now(),
    });
    delivered.push(event);
  }

  return ok({ delivered: delivered.length, pending: pendingCount() });
}

/** Start a background delivery loop. Returns { stop } to shut it down. */
export function startOutboxWorker(intervalMs = 1000): { stop: () => void } {
  const timer = setInterval(() => {
    try {
      processOutbox();
    } catch {
      // keep the worker alive
    }
  }, intervalMs);
  timer.unref();
  return {
    stop: () => clearInterval(timer),
  };
}