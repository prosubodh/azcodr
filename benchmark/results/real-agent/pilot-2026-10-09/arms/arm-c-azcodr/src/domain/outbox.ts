import { randomUUID } from 'node:crypto';

export type OutboxStatus = 'PENDING' | 'SENT';

/**
 * Transactional outbox entry (docs/rules/database_design.md): the event is
 * persisted in the SAME transaction as the aggregate mutation, then delivered
 * asynchronously with at-least-once semantics.
 */
export interface OutboxEntry {
  readonly id: string;
  readonly type: string;
  readonly aggregateId: string;
  readonly occurredAt: string;
  readonly payload: Record<string, unknown>;
  readonly status: OutboxStatus;
  readonly deliveryAttempts: number;
  readonly deliveredAt?: string;
}

export interface NewOutboxEntry {
  readonly type: string;
  readonly aggregateId: string;
  readonly payload: Record<string, unknown>;
}

export function createOutboxEntry(input: NewOutboxEntry): OutboxEntry {
  return {
    id: `evt_${randomUUID()}`,
    type: input.type,
    aggregateId: input.aggregateId,
    occurredAt: new Date().toISOString(),
    payload: { ...input.payload },
    status: 'PENDING',
    deliveryAttempts: 0
  };
}