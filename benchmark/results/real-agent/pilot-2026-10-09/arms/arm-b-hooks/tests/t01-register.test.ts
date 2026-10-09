import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { register, findUserByEmail, verifyPassword, db } from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

test("T01: valid registration persists a user with a securely hashed password", async () => {
  const res = await register({
    method: "POST",
    path: "/api/auth/register",
    body: { email: "alice@example.com", password: "supersecret1" },
  });

  assert.equal(res.status, 201);
  const body = res.body as any;
  assert.equal(body.user.email, "alice@example.com");
  assert.equal(body.user.passwordHash, undefined, "password hash must not be returned");

  const stored = findUserByEmail("alice@example.com")!;
  assert.ok(stored, "user persisted");
  assert.notEqual(stored.passwordHash, "supersecret1", "plaintext password must never be stored");
  assert.ok(stored.passwordHash!.includes(":"), "stored value should be salt:hash");
  assert.ok(verifyPassword("supersecret1", stored.passwordHash!), "correct password verifies");
  assert.equal(verifyPassword("wrongpass", stored.passwordHash!), false, "wrong password rejected");
});

test("T01: registering an existing email returns 409", async () => {
  await register({
    method: "POST",
    path: "/api/auth/register",
    body: { email: "bob@example.com", password: "anotherpass1" },
  });

  const res = await register({
    method: "POST",
    path: "/api/auth/register",
    body: { email: "bob@example.com", password: "anotherpass1" },
  });

  assert.equal(res.status, 409);
  assert.match((res.body as any).error, /already registered/i);
  assert.equal(db.count("users"), 1);
});

test("T01: invalid email or short password returns 400 and persists nothing", async () => {
  const bad = await register({
    method: "POST",
    path: "/api/auth/register",
    body: { email: "not-an-email", password: "supersecret1" },
  });
  assert.equal(bad.status, 400);

  const short = await register({
    method: "POST",
    path: "/api/auth/register",
    body: { email: "carol@example.com", password: "short" },
  });
  assert.equal(short.status, 400);
  assert.equal(db.count("users"), 0);
});