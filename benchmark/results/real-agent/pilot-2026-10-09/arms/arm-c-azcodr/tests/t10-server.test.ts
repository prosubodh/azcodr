import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createApiServer, shutdownServer } from '../src/transport/server.ts';
import { connect as netConnect } from 'node:net';

async function listen(server: ReturnType<typeof createApiServer>): Promise<number> {
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  assert.ok(address !== null && typeof address !== 'string');
  return address.port;
}

test('/health reports liveness over a real http server', async () => {
  const server = createApiServer({ isReady: () => true });
  const port = await listen(server);

  const res = await fetch(`http://127.0.0.1:${port}/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { status: 'ok' });

  await shutdownServer(server, { timeoutMs: 1000 });
  assert.equal(server.listening, false);
});

test('/ready gates on readiness: 503 before, 200 after', async () => {
  let ready = false;
  const server = createApiServer({ isReady: () => ready });
  const port = await listen(server);

  const notReady = await fetch(`http://127.0.0.1:${port}/ready`);
  assert.equal(notReady.status, 503);

  ready = true;
  const readyRes = await fetch(`http://127.0.0.1:${port}/ready`);
  assert.equal(readyRes.status, 200);
  assert.deepEqual(await readyRes.json(), { status: 'ready' });

  await shutdownServer(server, { timeoutMs: 1000 });
});

test('unknown paths and methods return 404', async () => {
  const server = createApiServer({ isReady: () => true });
  const port = await listen(server);

  const missing = await fetch(`http://127.0.0.1:${port}/nope`);
  assert.equal(missing.status, 404);

  const wrongMethod = await fetch(`http://127.0.0.1:${port}/health`, { method: 'POST' });
  assert.equal(wrongMethod.status, 404);

  await shutdownServer(server, { timeoutMs: 1000 });
});

test('shutdown drains a stuck connection within the time cap', async () => {
  const server = createApiServer({ isReady: () => true });
  const port = await listen(server);

  const stuck = netConnect({ host: '127.0.0.1', port });
  await new Promise<void>((resolve) => stuck.once('connect', () => resolve()));
  stuck.write('G'); // deliberately incomplete request: the connection is active, not idle

  try {
    const startedAt = Date.now();
    await shutdownServer(server, { timeoutMs: 150 });
    const elapsed = Date.now() - startedAt;

    assert.equal(server.listening, false);
    assert.ok(elapsed < 2000, `drain took ${elapsed}ms, expected to force-close within ~150ms`);
  } finally {
    stuck.destroy();
  }
});