import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { register, oauthCallback, makeOAuthCode, OAUTH_PROVIDERS } from "../src/auth.ts";
import { db, userByEmail } from "../src/db.ts";
import { pendingCount } from "../src/outbox.ts";
import { req, expectStatus, resetDb, expectOk } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

/** Dispatch a callback for a provider with a fresh code. */
function callback(provider: string, email: string, subject: string) {
  return oauthCallback(
    req("POST", `/api/auth/oauth/${provider}/callback`, {
      code: makeOAuthCode(provider as any, email, subject),
    }),
  );
}

test("T03: all three providers (GitHub, Google, Discord) complete the callback flow", () => {
  for (const provider of OAUTH_PROVIDERS) {
    const res = callback(provider, `user-${provider}@example.com`, `${provider}-subject-1`);
    expectStatus(res, 200);

    const body = expectOk(res);
    assert.equal(typeof body.token, "string");
    assert.equal(body.provider, provider);
    assert.equal(body.user.email, `user-${provider}@example.com`);

    // A local user row was created with provider linkage and no password.
    const stored = userByEmail(`user-${provider}@example.com`);
    assert.ok(stored);
    assert.equal(stored.oauthProvider, provider);
    assert.equal(stored.oauthSubject, `${provider}-subject-1`);
    assert.equal(stored.passwordHash, null);
  }
});

test("T03: each provider sign-in persisted an atomic outbox event", () => {
  callback("github", "gh@example.com", "github-1");
  assert.equal(pendingCount(), 1);

  callback("google", "gl@example.com", "google-1");
  assert.equal(pendingCount(), 2);
});

test("T03: returning OAuth users get a token for their existing account", () => {
  expectStatus(callback("github", "existing@example.com", "github-9"), 200);
  const firstId = expectOk(callback("github", "existing@example.com", "github-9")).user.id;

  const again = expectOk(callback("github", "existing@example.com", "github-9"));
  assert.equal(again.user.id, firstId, "same account on repeat sign-in");
  assert.equal(db.users.size, 1);
});

test("T03: a local email account can link a new OAuth provider", () => {
  expectStatus(
    register(req("POST", "/api/auth/register", {
      email: "exists@example.com",
      password: "password-123",
    })),
    201,
  );

  const res = callback("discord", "exists@example.com", "discord-7");
  expectStatus(res, 200);

  const body = expectOk(res);
  assert.equal(body.user.email, "exists@example.com");
  assert.equal(db.users.size, 1, "no duplicate user created");

  // The local password remains intact after linking.
  const stored = userByEmail("exists@example.com");
  assert.ok(stored?.passwordHash);
  assert.equal(stored.oauthProvider, "discord");
});

test("T03: invalid or cross-provider codes and unknown providers are rejected", () => {
  // Code minted for github replayed on the google callback.
  const crossProvider = oauthCallback(
    req("POST", "/api/auth/oauth/google/callback", {
      code: makeOAuthCode("github", "x@example.com", "github-1"),
    }),
  );
  expectStatus(crossProvider, 401);

  const garbage = oauthCallback(
    req("POST", "/api/auth/oauth/github/callback", {
      code: "not-a-valid-code!!!!",
    }),
  );
  expectStatus(garbage, 401);

  const missingCode = oauthCallback(req("POST", "/api/auth/oauth/github/callback", {}));
  expectStatus(missingCode, 400);

  const unknownProvider = oauthCallback(
    req("POST", "/api/auth/oauth/gitlab/callback", {
      code: makeOAuthCode("github", "x@example.com", "github-1"),
    }),
  );
  expectStatus(unknownProvider, 400);
});