import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAuthHandlers } from '../src/transport/auth.ts';
import { createInMemoryStore } from '../src/adapters/memoryStore.ts';
import { scryptPasswordHasher } from '../src/adapters/passwordHasher.ts';
import { createJwtSigner } from '../src/adapters/jwtSigner.ts';

function makeApp() {
  const store = createInMemoryStore();
  const tokenSigner = createJwtSigner({ secret: 'test-only-secret', ttlSeconds: 900 });
  const handlers = createAuthHandlers({
    userRepository: store.userRepository,
    passwordHasher: scryptPasswordHasher,
    tokenSigner
  });
  return { store, handlers, tokenSigner };
}

test('login returns a signed access token for valid credentials', async () => {
  const { handlers } = makeApp();
  const { register, login } = handlers;
  const credentials = { email: 'dana@example.com', password: 'v3ry-secure-pass' };
  await register({ method: 'POST', path: '/v1/auth/register', body: credentials, headers: {} });

  const res = await login({
    method: 'POST',
    path: '/v1/auth/login',
    body: { email: 'dana@example.com', password: 'v3ry-secure-pass' },
    headers: {}
  });
  assert.equal(res.status, 200);
  const body = res.body as { accessToken?: string };
  assert.equal(typeof body.accessToken, 'string');
});

test('issued access token carries a 15-minute expiry', async () => {
  const { handlers, tokenSigner } = makeApp();
  const { register, login } = handlers;
  const credentials = { email: 'erin@example.com', password: 'expiry-check-pass' };
  await register({ method: 'POST', path: '/v1/auth/register', body: credentials, headers: {} });

  const res = await login({
    method: 'POST',
    path: '/v1/auth/login',
    body: { email: 'erin@example.com', password: 'expiry-check-pass' },
    headers: {}
  });
  const token = (res.body as { accessToken: string }).accessToken;
  const claims = tokenSigner.verify(token);
  assert.ok(claims, 'issued token must verify');
  assert.equal(claims.exp, claims.iat + 900);
});

test('login returns 401 for a wrong password', async () => {
  const { handlers } = makeApp();
  const { register, login } = handlers;
  const credentials = { email: 'frank@example.com', password: 'right-password' };
  await register({ method: 'POST', path: '/v1/auth/register', body: credentials, headers: {} });

  const res = await login({
    method: 'POST',
    path: '/v1/auth/login',
    body: { email: 'frank@example.com', password: 'wrong-password' },
    headers: {}
  });
  assert.equal(res.status, 401);
});

test('login returns 401 for an unknown email', async () => {
  const { handlers } = makeApp();
  const { login } = handlers;
  const res = await login({
    method: 'POST',
    path: '/v1/auth/login',
    body: { email: 'ghost@example.com', password: 'any-password' },
    headers: {}
  });
  assert.equal(res.status, 401);
});