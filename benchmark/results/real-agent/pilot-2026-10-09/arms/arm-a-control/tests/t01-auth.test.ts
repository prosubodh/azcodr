import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { db } from "../src/db.ts";
import { register } from "../src/auth.ts";
import { verifyPassword } from "../src/crypto.ts";
import { pendingCount } from "../src/outbox.ts";
import { req, expectStatus, resetDb, expectOk } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

test("T01: valid registration persists a user with a securely hashed password", () => {
  const res = register(req("POST", "/api/auth/register", {
    email: "Ada.Lovelace@Example.com",
    password: "super-secret-1",
  }));
  expectStatus(res, 201);

  const body = expectOk(res);
  const userId = body.user.id as string;
  const user = db.users.get(userId);
  assert.ok(user, "user row was persisted");

  // Password is never stored in plaintext and verifies against the hash.
  assert.notEqual(user.passwordHash, "super-secret-1");
  assert.ok(user.passwordHash?.startsWith("scrypt$"), "stored hash uses scrypt scheme");
  assert.equal(verifyPassword("super-secret-1", user.passwordHash as string), true);
  assert.equal(verifyPassword("wrong", user.passwordHash as string), false);

  // The email is normalized on persist.
  assert.equal(user.email, "ada.lovelace@example.com");

  // T06 tie-in: the outbox event was written atomically with the user.
  assert.equal(pendingCount(), 1);
});

test("T01: registering an existing email returns 409", () => {
  const first = register(req("POST", "/api/auth/register", {
    email: "dupe@example.com",
    password: "super-secret-1",
  }));
  expectStatus(first, 201);

  const second = register(req("POST", "/api/auth/register", {
    email: "DUPE@example.com", // case-insensitive match
    password: "another-secret",
  }));
  expectStatus(second, 409);
  assert.equal((second.body as { error: string }).error, "email already registered");

  // No duplicate user rows.
  const users = [...db.users.values()].filter((u) => u.email === "dupe@example.com");
  assert.equal(users.length, 1);
});

test("T01: invalid payloads are rejected with 400", () => {
  const badEmail = register(req("POST", "/api/auth/register", {
    email: "not-an-email",
    password: "super-secret-1",
  }));
  expectStatus(badEmail, 400);

  const shortPassword = register(req("POST", "/api/auth/register", {
    email: "ok@example.com",
    password: "short",
  }));
  expectStatus(shortPassword, 400);
  assert.equal(db.users.size, 0);
});