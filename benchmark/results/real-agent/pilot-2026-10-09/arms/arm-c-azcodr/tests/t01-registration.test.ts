import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuthHandlers } from '../src/transport/auth.ts';
import { createInMemoryStore } from '../src/adapters/memoryStore.ts';
import { scryptPasswordHasher } from '../src/adapters/passwordHasher.ts';
import { createJwtSigner } from '../src/adapters/jwtSigner.ts';

function makeAuthApp() {
  const store = createInMemoryStore();
  return {
    store,
    handlers: createAuthHandlers({
      userRepository: store.userRepository,
      passwordHasher: scryptPasswordHasher,
      tokenSigner: createJwtSigner({ secret: 'test-only-secret', ttlSeconds: 900 })
    })
  };
}

test('register returns 201 for valid credentials', async () => {
  const { handlers } = makeAuthApp();
  const { register } = handlers;
  const res = await register({
    method: 'POST',
    path: '/v1/auth/register',
    body: { email: 'alice@example.com', password: 'hunter2-secret' },
    headers: {}
  });
  assert.equal(res.status, 201);
});

test('register persists a user with a securely scrypt-hashed password', async () => {
  const { store, handlers } = makeAuthApp();
  const { register } = handlers;
  await register({
    method: 'POST',
    path: '/v1/auth/register',
    body: { email: 'bob@example.com', password: 'correct-horse-battery' },
    headers: {}
  });
  const saved = store.users[0];
  assert.ok(saved, 'a user row must be persisted');
  assert.notEqual(saved.passwordHash, 'correct-horse-battery');
  assert.match(saved.passwordHash, /^scrypt:/);
});

test('register returns 409 when the email already exists', async () => {
  const { handlers } = makeAuthApp();
  const { register } = handlers;
  const request = {
    method: 'POST',
    path: '/v1/auth/register',
    body: { email: 'carol@example.com', password: 'already-taken' },
    headers: {}
  };
  await register(request);
  const res = await register(request);
  assert.equal(res.status, 409);
  assert.equal((res.body as { code?: string }).code, 'EMAIL_TAKEN');
});