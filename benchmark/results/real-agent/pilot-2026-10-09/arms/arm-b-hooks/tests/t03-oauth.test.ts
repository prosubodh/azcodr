import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  handleOAuth,
  makeOAuthCode,
  register,
  login,
  findUserByEmail,
  decodeTokenPayload,
  db,
} from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

async function authorize(provider: string) {
  return handleOAuth({ method: "GET", path: `/oauth/${provider}/authorize` });
}

function callback(provider: string, body: { code: string; state: string }) {
  return handleOAuth({ method: "GET", path: `/oauth/${provider}/callback`, body });
}

const PROVIDERS = ["github", "google", "discord"] as const;

test("T03: authorize returns a provider URL with a state nonce for all three providers", async () => {
  for (const provider of PROVIDERS) {
    const res = await authorize(provider);
    assert.equal(res.status, 200);
    const body = res.body as any;
    assert.ok((body.url as string).startsWith("http"), `${provider} url present`);
    assert.ok((body.url as string).includes("state="));
    assert.equal(body.state.length, 32, "state nonce is hex (16 bytes)");
    assert.equal(db.count("pendingOAuth"), 1);
    db.reset();
  }
});

test("T03: GitHub callback issues a token and creates (or links) the user", async () => {
  const auth = await authorize("github");
  const { state } = auth.body as any;
  const code = makeOAuthCode({ sub: "gh-12345", email: "octo@github.dev", name: "Octo Cat" });

  const res = await callback("github", { code, state });
  assert.equal(res.status, 200);
  const body = res.body as any;
  assert.equal(body.provider, "github");
  assert.equal(body.user.email, "octo@github.dev");
  assert.ok(body.accessToken.split(".").length === 3);
  assert.equal(decodeTokenPayload(body.accessToken)!.exp - decodeTokenPayload(body.accessToken)!.iat, 900);

  const user = findUserByEmail("octo@github.dev")!;
  assert.ok(user);
  assert.equal(user.oauth!.github.providerId, "github:gh-12345");
  assert.equal(db.count("pendingOAuth"), 0, "state is consumed after one-time use");
});

test("T03: same email via Google links the existing account, no duplicate user", async () => {
  // First sign up with password identically.
  await register({
    method: "POST",
    path: "/api/auth/register",
    body: { email: "multi@example.com", password: "somepassword1" },
  });

  const auth = await authorize("google");
  const { state } = auth.body as any;
  const code = makeOAuthCode({ sub: "g-42", email: "multi@example.com", name: "Multi Person" });

  const res = await callback("google", { code, state });
  assert.equal(res.status, 200);
  const body = res.body as any;

  assert.equal(body.user.id, findUserByEmail("multi@example.com")!.id, "existing user reused");
  assert.equal(db.count("users"), 1);
  assert.equal(findUserByEmail("multi@example.com")!.oauth!.google.providerId, "google:g-42");

  // The password login still works for the linked account.
  const loginRes = await login({
    method: "POST",
    path: "/api/auth/login",
    body: { email: "multi@example.com", password: "somepassword1" },
  });
  assert.equal(loginRes.status, 200);
});

test("T03: Discord callback with an unknown email creates a fresh OAuth-only user", async () => {
  const auth = await authorize("discord");
  const { state } = auth.body as any;
  const code = makeOAuthCode({ sub: "d-7", email: "new@discord.app", name: "New User" });

  const res = await callback("discord", { code, state });
  assert.equal(res.status, 200);
  assert.equal((res.body as any).user.email, "new@discord.app");
  const user = findUserByEmail("new@discord.app")!;
  assert.ok(user);
  assert.equal(user.passwordHash, null, "OAuth-only accounts have no password");
});

test("T03: callback with a bogus state is rejected with 401 and consumes nothing", async () => {
  const code = makeOAuthCode({ sub: "x-1", email: "x@example.com", name: "X" });
  const res = await callback("github", { code, state: "not-a-real-state" });
  assert.equal(res.status, 401);
  assert.equal(db.count("users"), 0);
});

test("T03: callback with a malformed code is rejected with 400", async () => {
  const auth = await authorize("google");
  const { state } = auth.body as any;
  const res = await callback("google", { code: "!!!not-base64url-json!!!", state });
  assert.equal(res.status, 400);
});

test("T03: unknown provider returns 404", async () => {
  const res = await handleOAuth({ method: "GET", path: "/oauth/gitlab/authorize" });
  assert.equal(res.status, 404);
});