/**
 * Password hashing (scrypt) and stateless JWT signing/verification.
 * Everything here is implemented with `node:crypto` only.
 */
import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { HttpError, type HttpHeaders } from "./types.ts";

const JWT_SECRET = process.env.JWT_SECRET ?? "arm-b-dev-secret-change-me";
export const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000; // 15 minutes

// ---- Passwords (scrypt with random salt, stored as `salt:hash`) ----

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

// ---- JWT (HS256, base64url) ----

export interface TokenPayload {
  sub: string;
  email: string;
  iat: number; // issued-at (seconds)
  exp: number; // expiry (seconds)
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64url");
}

export function signToken(claims: { sub: string; email: string }): string {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Date.now();
  const payload = b64url(
    JSON.stringify({
      ...claims,
      iat: Math.floor(now / 1000),
      exp: Math.floor((now + ACCESS_TOKEN_TTL_MS) / 1000),
    }),
  );
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, sig] = parts;
  const expected = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest();
  const provided = Buffer.from(sig, "base64url");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
  let parsed: TokenPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
  if (typeof parsed.exp !== "number" || parsed.exp * 1000 < Date.now()) return null;
  return parsed;
}

export function decodeTokenPayload(token: string): TokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as TokenPayload;
  } catch {
    return null;
  }
}

// ---- Request authentication ----

export function headerValue(headers: HttpHeaders | undefined, name: string): string | undefined {
  if (!headers) return undefined;
  const direct = headers[name];
  if (direct !== undefined) return Array.isArray(direct) ? direct[0] : direct;
  const entry = Object.entries(headers).find(([k]) => k.toLowerCase() === name.toLowerCase());
  if (!entry) return undefined;
  const value = entry[1];
  return Array.isArray(value) ? value[0] : value;
}

/** Validates the `Authorization: Bearer <token>` header; throws 401 otherwise. */
export function authenticate(headers: HttpHeaders | undefined): { userId: string; email: string } {
  const auth = headerValue(headers, "authorization");
  if (!auth || !/^Bearer\s+/i.test(auth)) {
    throw new HttpError(401, "authentication required");
  }
  const token = auth.replace(/^Bearer\s+/i, "").trim();
  const payload = verifyToken(token);
  if (!payload) throw new HttpError(401, "invalid or expired token");
  return { userId: payload.sub, email: payload.email };
}