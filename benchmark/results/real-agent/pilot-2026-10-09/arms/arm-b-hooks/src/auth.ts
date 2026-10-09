/**
 * T01 – User registration with password hashing
 * T02 – JWT authentication and session issuance
 */
import { db, newId, nowIso } from "./db.ts";
import { hashPassword, signToken, verifyPassword } from "./crypto.ts";
import { HttpError, pathSegments, respond, type HttpRequest, type HttpResponse } from "./types.ts";

export interface User {
  id: string;
  email: string;
  passwordHash: string | null; // null for OAuth-only accounts
  createdAt: string;
  /** provider -> provider-scoped identity, populated for OAuth-linked accounts */
  oauth?: Record<string, { providerId: string; name?: string }>;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function findUserByEmail(email: string): User | undefined {
  return db.findOne<User>("users", (u) => u.email === email);
}

export function findUserById(id: string): User | undefined {
  return db.find<User>("users", id);
}

export async function register(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "auth" || seg[2] !== "register") throw new HttpError(404, "not found");
    if (req.method.toUpperCase() !== "POST") throw new HttpError(405, "method not allowed");

    const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!EMAIL_RE.test(email)) throw new HttpError(400, "invalid email address");
    if (password.length < 8) throw new HttpError(400, "password must be at least 8 characters");

    if (findUserByEmail(email)) throw new HttpError(409, "email already registered");

    const user: User = {
      id: newId(),
      email,
      passwordHash: hashPassword(password),
      createdAt: nowIso(),
    };
    db.insert("users", user);

    return {
      status: 201,
      body: {
        user: { id: user.id, email: user.email, createdAt: user.createdAt },
      },
    };
  });
}

export async function login(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "auth" || seg[2] !== "login") throw new HttpError(404, "not found");
    if (req.method.toUpperCase() !== "POST") throw new HttpError(405, "method not allowed");

    const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    const user = findUserByEmail(email);
    // Uniform failure response so we don't leak which account exists.
    if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
      throw new HttpError(401, "invalid credentials");
    }

    return {
      status: 200,
      body: {
        accessToken: signToken({ sub: user.id, email: user.email }),
        tokenType: "Bearer",
        expiresIn: 15 * 60, // seconds
        user: { id: user.id, email: user.email },
      },
    };
  });
}

export async function handleAuth(req: HttpRequest): Promise<HttpResponse> {
  const seg = pathSegments(req.path);
  if (seg[2] === "register") return register(req);
  if (seg[2] === "login") return login(req);
  return { status: 404, body: { error: "not found" } };
}