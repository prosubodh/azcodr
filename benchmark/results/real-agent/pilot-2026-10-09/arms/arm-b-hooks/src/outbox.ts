/**
 * Transactional outbox (T06).
 *
 * Domain events are persisted with the change that produced them by publishing
 * them through a transaction (`publishEvent(tx, ...)`): the event row only
 * becomes visible when the surrounding transaction commits, so the event log
 * can never drift from the entity state. A background-style worker
 * (`processOutbox`) delivers pending events and marks them sent.
 */
import { db, nowIso, newId, type Tx } from "./db.ts";

export type OutboxEventStatus = "pending" | "sent";

export interface OutboxEvent {
  id: string;
  /** Monotonic publish order (FIFO), assigned at publish time inside the transaction. */
  seq: number;
  aggregateType: string;
  aggregateId: string;
  type: string;
  payload: Record<string, unknown>;
  status: OutboxEventStatus;
  createdAt: string;
  sentAt?: string;
}

export interface NewOutboxEvent {
  aggregateType: string;
  aggregateId: string;
  type: string;
  payload: Record<string, unknown>;
}

let seqCounter = 0;

/**
 * Publishes an event inside the given transaction. The event is only persisted
 * when the surrounding transaction commits — atomic with the entity change.
 */
export function publishEvent(tx: Tx, event: NewOutboxEvent): void {
  tx.insert<OutboxEvent>("outboxEvents", {
    id: newId(),
    seq: ++seqCounter,
    aggregateType: event.aggregateType,
    aggregateId: event.aggregateId,
    type: event.type,
    payload: event.payload,
    status: "pending",
    createdAt: nowIso(),
  });
}

export function pendingEvents(): OutboxEvent[] {
  return db
    .findAll<OutboxEvent>("outboxEvents")
    .filter((e) => e.status === "pending")
    .sort((a, b) => a.seq - b.seq);
}

export interface OutboxResult {
  delivered: OutboxEvent[];
  remainingPending: number;
}

/**
 * Background worker: publishes (delivers) every pending event and marks it sent.
 * `deliver` may be a no-op subscriber; it runs before the event is marked sent.
 */
export async function processOutbox(
  deliver: (event: OutboxEvent) => void | Promise<void> = async () => {},
): Promise<OutboxResult> {
  const pending = pendingEvents();
  const delivered: OutboxEvent[] = [];
  for (const event of pending) {
    await deliver(event);
    const updated = db.update<OutboxEvent>("outboxEvents", event.id, {
      status: "sent",
      sentAt: nowIso(),
    });
    delivered.push(updated ?? { ...event, status: "sent" });
  }
  return { delivered, remainingPending: pendingEvents().length };
}