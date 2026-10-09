import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { register, login } from "../src/auth.ts";
import { verifyJwt } from "../src/crypto.ts";
import type { JwtPayload } from "../src/crypto.ts";
import { JWT_SECRET } from "../src/config.ts";
import { req, expectStatus, resetDb, expectOk } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

function seedUser(email = "grace@example.com", password = "password-123") {
  expectStatus(
    register(req("POST", "/api/auth/register", { email, password })),
    201,
  );
}

test("T02: valid credentials return a signed access token with 15-minute expiry", () => {
  seedUser();
  const res = login(req("POST", "/api/auth/login", {
    email: "grace@example.com",
    password: "password-123",
  }));
  expectStatus(res, 200);

  const body = expectOk(res);
  assert.equal(typeof body.token, "string");
  assert.equal(body.expiresIn, 15 * 60);
  assert.equal(body.user.email, "grace@example.com");

  const token = body.token as string;
  assert.equal(token.split(".").length, 3, "JWT has header.payload.signature");

  const payload = verifyJwt(token, JWT_SECRET);
  assert.equal(payload.sub, body.user.id);
  assert.equal(payload.email, "grace@example.com");
  // 15-minute expiry: exp should be 900s after iat.
  assert.equal(payload.exp - payload.iat, 900);
});

test("T02: invalid credentials return 401", () => {
  seedUser("grace@example.com", "password-123");

  const wrongPassword = login(req("POST", "/api/auth/login", {
    email: "grace@example.com",
    password: "nope-nope-nope",
  }));
  expectStatus(wrongPassword, 401);

  const unknownEmail = login(req("POST", "/api/auth/login", {
    email: "ghost@example.com",
    password: "password-123",
  }));
  expectStatus(unknownEmail, 401);
});

test("T02: a token signed with a different secret fails verification", () => {
  seedUser();
  const res = expectOk(login(req("POST", "/api/auth/login", {
    email: "grace@example.com",
    password: "password-123",
  })));
  const token = res.token as string;
  assert.throws(() => verifyJwt(token, "wrong-secret"), /invalid signature/);
});

test("T02: an expired token is rejected", async () => {
  seedUser();
  const res = expectOk(login(req("POST", "/api/auth/login", {
    email: "grace@example.com",
    password: "password-123",
  })));
  const token = res.token as string;

  // Forge an expired token using the same signing secret.
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: res.user.id as string,
    email: "grace@example.com",
    iat: now - 901,
    exp: now - 1,
    jti: "forged",
  };
  const payloadPart = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const { createHmac } = await import("node:crypto");
  const signature = createHmac("sha256", JWT_SECRET)
    .update(`${header}.${payloadPart}`)
    .digest("base64url");
  const forged = `${header}.${payloadPart}.${signature}`;

  assert.throws(() => verifyJwt(forged, JWT_SECRET), /expired/);
});