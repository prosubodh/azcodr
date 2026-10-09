import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { login, register, decodeTokenPayload, db } from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

const EMAIL = "dave@example.com";
const PASSWORD = "correcthorse1";

async function setupUser() {
  await register({ method: "POST", path: "/api/auth/register", body: { email: EMAIL, password: PASSWORD } });
}

test("T02: valid credentials return a signed access token with a 15-minute expiry", async () => {
  await setupUser();
  const res = await login({
    method: "POST",
    path: "/api/auth/login",
    body: { email: EMAIL, password: PASSWORD },
  });

  assert.equal(res.status, 200);
  const body = res.body as any;
  assert.ok(typeof body.accessToken === "string" && body.accessToken.split(".").length === 3);
  assert.equal(body.tokenType, "Bearer");
  assert.equal(body.expiresIn, 900); // 15 minutes in seconds
  assert.equal(body.user.email, EMAIL);

  const payload = decodeTokenPayload(body.accessToken)!;
  assert.equal(payload.sub, body.user.id);
  assert.equal(payload.exp - payload.iat, 900, "token lifetime must be exactly 15 minutes");
});

test("T02: invalid credentials return 401", async () => {
  await setupUser();

  const wrongPassword = await login({
    method: "POST",
    path: "/api/auth/login",
    body: { email: EMAIL, password: "not-the-password" },
  });
  assert.equal(wrongPassword.status, 401);

  const unknownEmail = await login({
    method: "POST",
    path: "/api/auth/login",
    body: { email: "ghost@example.com", password: PASSWORD },
  });
  assert.equal(unknownEmail.status, 401);

  // Uniform error body, no account enumeration
  assert.deepEqual(
    (wrongPassword.body as any).error,
    (unknownEmail.body as any).error,
  );
});