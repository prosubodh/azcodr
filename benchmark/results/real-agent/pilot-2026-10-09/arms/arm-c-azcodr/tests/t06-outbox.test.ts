import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, registerAndLogin } from './helpers/app.ts';
import { createInMemoryStore } from '../src/adapters/memoryStore.ts';
import { createUnitOfWork } from '../src/adapters/unitOfWork.ts';
import { createOutboxEntry, type OutboxEntry } from '../src/domain/outbox.ts';
import { drainOutbox } from '../src/application/outboxWorker.ts';

test('workspace creation stages a PENDING WorkspaceCreated outbox event atomically', async () => {
  const app = createTestApp();
  const token = await registerAndLogin(app, 'outbox-owner@example.com');
  const created = await app.workspace.createWorkspace({
    method: 'POST',
    path: '/v1/workspaces',
    body: { name: 'Outbox Org' },
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(created.status, 201);

  const outbox = app.store.outbox as OutboxEntry[];
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0]?.type, 'WorkspaceCreated');
  assert.equal(outbox[0]?.status, 'PENDING');
  assert.equal(outbox[0]?.aggregateId, app.store.workspaces[0]?.id);
});

test('drainOutbox publishes every pending entry and marks them SENT', async () => {
  const store = createInMemoryStore();
  const first = createOutboxEntry({ type: 'WorkspaceCreated', aggregateId: 'ws_1', payload: {} });
  const second = createOutboxEntry({ type: 'WorkspaceCreated', aggregateId: 'ws_2', payload: {} });
  await store.outboxRepository.stage(first);
  await store.outboxRepository.stage(second);

  const published: string[] = [];
  const publisher = {
    async publish(entry: OutboxEntry) {
      published.push(entry.id);
    }
  };

  await drainOutbox({ outboxRepository: store.outboxRepository, publisher }, { limit: 10 });

  assert.deepEqual(published, [first.id, second.id]);
  const after = store.outbox as OutboxEntry[];
  assert.equal(after.every((e) => e.status === 'SENT'), true);
  assert.equal(after.every((e) => e.deliveredAt !== undefined), true);
});

test('a failed transaction rolls back the staged outbox event atomically', async () => {
  const store = createInMemoryStore();
  const unitOfWork = createUnitOfWork(store);
  const entry = createOutboxEntry({ type: 'WorkspaceCreated', aggregateId: 'ws_9', payload: {} });

  await assert.rejects(
    unitOfWork.run(async () => {
      await store.outboxRepository.stage(entry);
      throw new Error('boom');
    }),
    /boom/
  );

  assert.equal((store.outbox as OutboxEntry[]).length, 0);
});