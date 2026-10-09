import type { OutboxRepositoryPort } from '../domain/ports/repositories.ts';
import type { PendingEventPublisherPort } from '../domain/ports/events.ts';
import type { OutboxEntry } from '../domain/outbox.ts';

export interface OutboxWorkerDeps {
  readonly outboxRepository: OutboxRepositoryPort;
  readonly publisher: PendingEventPublisherPort;
}

export interface DrainOptions {
  readonly limit: number;
}

/**
 * Async delivery worker for the transactional outbox. Publishes each pending
 * entry at-least-once, then marks it SENT. A failed publish leaves the entry
 * PENDING so the next drain retries it (consumers must be idempotent).
 */
export async function drainOutbox(deps: OutboxWorkerDeps, options: DrainOptions): Promise<OutboxEntry[]> {
  const pending = await deps.outboxRepository.listPending(options.limit);
  for (const entry of pending) {
    await deps.publisher.publish(entry);
    await deps.outboxRepository.markSent(entry.id, new Date().toISOString());
  }
  return pending;
}