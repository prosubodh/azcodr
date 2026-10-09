import type { OutboxEntry } from '../outbox.ts';

/** Background delivery of staged events; consumers must be idempotent. */
export interface PendingEventPublisherPort {
  publish(entry: OutboxEntry): Promise<void>;
}