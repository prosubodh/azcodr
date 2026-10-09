import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createOAuthHandlers } from '../src/transport/oauth.ts';
import { createInMemoryStore } from '../src/adapters/memoryStore.ts';
import { scryptPasswordHasher } from '../src/adapters/passwordHasher.ts';
import { createJwtSigner } from '../src/adapters/jwtSigner.ts';
import { createOAuthRegistry } from '../src/adapters/oauth/registry.ts';
import { createGithubStrategy } from '../src/adapters/oauth/github.ts';
import { createGoogleStrategy } from '../src/adapters/oauth/google.ts';
import { createDiscordStrategy } from '../src/adapters/oauth/discord.ts';
import type { HttpJson } from '../src/adapters/oauth/core.ts';

/** Stub upstream: token exchange + profile endpoints respond from fixtures. */
function makeFakeHttp(profile: unknown): HttpJson {
  return async (url, init) => {
    if (init?.method === 'POST') return { access_token: 'fake-access-token' };
    if (String(url).includes('/user')) return profile;
    if (String(url).includes('userinfo')) return profile;
    if (String(url).includes('/@me')) return profile;
    throw new Error('unexpected fake request');
  };
}

function makeApp(profile: unknown = { id: 1, email: 'oauth@example.com', name: 'OAuth User' }) {
  const store = createInMemoryStore();
  const tokenSigner = createJwtSigner({ secret: 'test-only-secret', ttlSeconds: 900 });
  const registry = createOAuthRegistry([
    createGithubStrategy(
      { clientId: 'gh-id', clientSecret: 'gh-secret', redirectUri: 'http://local/cb/github' },
      makeFakeHttp(profile)
    ),
    createGoogleStrategy(
      { clientId: 'go-id', clientSecret: 'go-secret', redirectUri: 'http://local/cb/google' },
      makeFakeHttp({ sub: 'google-123', email: 'oauth@example.com', name: 'OAuth User' })
    ),
    createDiscordStrategy(
      { clientId: 'di-id', clientSecret: 'di-secret', redirectUri: 'http://local/cb/discord' },
      makeFakeHttp({ id: 'discord-123', email: 'oauth@example.com', username: 'oauthuser' })
    )
  ]);
  const handlers = createOAuthHandlers({
    registry,
    userRepository: store.userRepository,
    oauthAccountRepository: store.oauthAccountRepository,
    passwordHasher: scryptPasswordHasher,
    tokenSigner
  });
  return { store, registry, tokenSigner, handlers };
}

test('github authorize returns a state-bound authorize url', async () => {
  const { handlers } = makeApp();
  const res = await handlers.authorize({
    method: 'GET',
    path: '/v1/oauth/github/authorize?state=csrf-token-1',
    headers: {}
  });
  assert.equal(res.status, 200);
  const authorizeUrl = (res.body as { authorizeUrl: string }).authorizeUrl;
  assert.ok(authorizeUrl.startsWith('https://github.com/login/oauth/authorize?'));
  assert.ok(authorizeUrl.includes('client_id=gh-id'));
  assert.ok(authorizeUrl.includes('state=csrf-token-1'));
});

test('github callback exchanges the code, links the identity, and issues a token', async () => {
  const { store, handlers } = makeApp();
  const res = await handlers.callback({
    method: 'GET',
    path: '/v1/oauth/github/callback?code=github-code-1',
    headers: {}
  });
  assert.equal(res.status, 200);
  assert.equal(typeof (res.body as { accessToken?: string }).accessToken, 'string');
  assert.equal(store.users.length, 1);
  assert.equal(store.oauthAccounts.length, 1);
  assert.equal(store.oauthAccounts[0]?.provider, 'github');
});

test('google and discord callbacks also complete the flow', async () => {
  const { store, handlers } = makeApp();
  const google = await handlers.callback({
    method: 'GET',
    path: '/v1/oauth/google/callback?code=google-code-1',
    headers: {}
  });
  const discord = await handlers.callback({
    method: 'GET',
    path: '/v1/oauth/discord/callback?code=discord-code-1',
    headers: {}
  });
  assert.equal(typeof (google.body as { accessToken?: string }).accessToken, 'string');
  assert.equal(typeof (discord.body as { accessToken?: string }).accessToken, 'string');
  assert.deepEqual(
    store.oauthAccounts.map((a) => a.provider).sort(),
    ['discord', 'google']
  );
  // Both identities link to a single local user sharing the same email.
  assert.equal(store.users.length, 1);
});

test('repeating the same provider callback does not duplicate the user', async () => {
  const { store, handlers } = makeApp();
  const call = { method: 'GET', path: '/v1/oauth/github/callback?code=github-code-again', headers: {} };
  await handlers.callback(call);
  const res = await handlers.callback(call);
  assert.equal(res.status, 200);
  assert.equal(store.users.length, 1);
  assert.equal(store.oauthAccounts.length, 1);
});

test('unknown oauth provider is rejected', async () => {
  const { handlers } = makeApp();
  const res = await handlers.authorize({
    method: 'GET',
    path: '/v1/oauth/unknown/authorize?state=x',
    headers: {}
  });
  assert.equal(res.status, 422);
  assert.equal((res.body as { code?: string }).code, 'UNKNOWN_OAUTH_PROVIDER');
});