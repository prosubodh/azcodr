import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

// ---------------------------------------------------------------------------
// Password hashing (scrypt, bcrypt/argon2-style parameters are not needed;
// scrypt with a random salt and 64-byte key is a strong password KDF).
// ---------------------------------------------------------------------------

const SCRYPT_KEYLEN = 64;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, saltHex, hashHex] = stored.split("$");
  if (algo !== "scrypt" || !saltHex || !hashHex) return false;
  const salt = Buffer.from(saltHex, "hex");
  if (salt.length === 0) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, salt, expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

// ---------------------------------------------------------------------------
// JWT (compact JWS, HS256) using only node:crypto.
// ---------------------------------------------------------------------------

export interface JwtPayload {
  sub: string; // user id
  email: string;
  iat: number;
  exp: number;
  jti: string;
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

function hmacSha256(secret: string, data: string): Buffer {
  return createHmac("sha256", secret).update(data).digest();
}

export function signJwt(
  sub: string,
  email: string,
  secret: string,
  ttlSeconds: number,
): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub,
    email,
    iat: now,
    exp: now + ttlSeconds,
    jti: randomBytes(8).toString("hex"),
  };
  const payloadPart = b64url(JSON.stringify(payload));
  const unsigned = `${header}.${payloadPart}`;
  const signature = b64url(hmacSha256(secret, unsigned));
  return `${unsigned}.${signature}`;
}

export function verifyJwt(token: string, secret: string): JwtPayload {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("malformed token");
  const [headerPart, payloadPart, signaturePart] = parts;
  const expected = hmacSha256(secret, `${headerPart}.${payloadPart}`);
  const received = Buffer.from(signaturePart, "base64url");
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) {
    throw new Error("invalid signature");
  }
  let payload: JwtPayload;
  try {
    payload = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8")) as JwtPayload;
  } catch {
    throw new Error("malformed payload");
  }
  if (typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now()) {
    throw new Error("token expired");
  }
  if (typeof payload.sub !== "string") throw new Error("missing subject");
  return payload;
}

// ---------------------------------------------------------------------------
// Generic HMAC helpers (used for Stripe webhook signatures).
// ---------------------------------------------------------------------------

export function hmacHex(secret: string, data: string): string {
  return hmacSha256(secret, data).toString("hex");
}

export function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}