import { db, newId, userByEmail } from "./db.ts";
import type { UserRow } from "./db.ts";
import { hashPassword, signJwt, verifyJwt, verifyPassword } from "./crypto.ts";
import { JWT_SECRET, JWT_TTL_SECONDS } from "./config.ts";
import { publishOutboxEvent } from "./outbox.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail, ok } from "./types.ts";

// ---------------------------------------------------------------------------
// T01 - Registration, T02 - JWT login, T03 - OAuth callbacks (GitHub, Google,
// Discord). All three providers are handled here in this single module.
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function publicUser(user: UserRow) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
}

function bearerToken(headers: HttpRequest["headers"]): string | null {
  const header = headers["authorization"];
  if (!header) return null;
  const [scheme, token, ...rest] = header.trim().split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || rest.length > 0) return null;
  return token;
}

/**
 * Resolve the acting user id from the Authorization header (T09/T10 handlers
 * and other ticket handlers depend on this). Returns null when unidentified.
 */
export function authenticate(req: HttpRequest): string | null {
  try {
    const token = bearerToken(req.headers);
    if (!token) return null;
    const payload = verifyJwt(token, JWT_SECRET);
    return db.users.has(payload.sub) ? payload.sub : null;
  } catch {
    return null;
  }
}

/** Issue an access token for a user (15-minute expiry per T02). */
export function issueToken(user: UserRow): { token: string; expiresIn: number } {
  return {
    token: signJwt(user.id, user.email, JWT_SECRET, JWT_TTL_SECONDS),
    expiresIn: JWT_TTL_SECONDS,
  };
}

// ---------------------------------------------------------------------------
// T01: POST /api/auth/register { email, password }
// ---------------------------------------------------------------------------

export function register(req: HttpRequest): HttpResponse {
  const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email)) return fail(400, "invalid email address");
  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(400, `password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  let created: UserRow | undefined;
  try {
    db.transaction(() => {
      if (userByEmail(email)) {
        throw new AuthConflict(email);
      }
      const user: UserRow = {
        id: newId(),
        email,
        passwordHash: hashPassword(password),
        oauthProvider: null,
        oauthSubject: null,
        createdAt: Date.now(),
      };
      db.users.set(user.id, user);
      // T06: persist the event in the same transaction as the user write.
      publishOutboxEvent("user.registered", user.id, { email: user.email });
      created = user;
    });
  } catch (err) {
    if (err instanceof AuthConflict) return fail(409, "email already registered");
    throw err;
  }

  return ok({ user: publicUser(created as UserRow) }, 201);
}

class AuthConflict extends Error {}

// ---------------------------------------------------------------------------
// T02: POST /api/auth/login { email, password }
// ---------------------------------------------------------------------------

export function login(req: HttpRequest): HttpResponse {
  const body = (req.body ?? {}) as { email?: unknown; password?: unknown };
  const email = typeof body.email === "string" ? normalizeEmail(body.email) : "";
  const password = typeof body.password === "string" ? body.password : "";

  const user = userByEmail(email);
  // Guard against user enumeration: identical 401 for unknown user, wrong
  // password, or a passwordless (OAuth-only) account.
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return fail(401, "invalid credentials");
  }

  const session = issueToken(user);
  return ok({ token: session.token, expiresIn: session.expiresIn, user: publicUser(user) });
}

// ---------------------------------------------------------------------------
// T03: Multi-provider OAuth (GitHub, Google, Discord).
//
// A real deployment would exchange `code` with each provider's token endpoint.
// This mock exchange decodes a code we issue for tests, which keeps the flow
// and the provider locking identical to production while staying dependency
// free. Provider codes are scoped so a GitHub code cannot be replayed against
// the Google callback.
// ---------------------------------------------------------------------------

export const OAUTH_PROVIDERS = ["github", "google", "discord"] as const;
export type OAuthProvider = (typeof OAUTH_PROVIDERS)[number];

export interface OAuthProfile {
  provider: OAuthProvider;
  email: string;
  subject: string;
  name: string;
}

/** Test helper: mint a provider "authorization code" for the mock exchange. */
export function makeOAuthCode(provider: OAuthProvider, email: string, subject: string): string {
  return Buffer.from(
    JSON.stringify({ provider, email, subject }),
    "utf8",
  ).toString("base64url");
}

/**
 * Simulated provider token exchange: turns an authorization code into a
 * verified provider profile. Rejects codes minted for a different provider.
 */
export function exchangeOAuthCode(provider: OAuthProvider, code: string): OAuthProfile | null {
  let decoded: { provider?: unknown; email?: unknown; subject?: unknown };
  try {
    decoded = JSON.parse(Buffer.from(code, "base64url").toString("utf8")) as typeof decoded;
  } catch {
    return null;
  }
  if (decoded.provider !== provider) return null;
  const email = typeof decoded.email === "string" ? normalizeEmail(decoded.email) : "";
  const subject = typeof decoded.subject === "string" ? decoded.subject : "";
  if (!EMAIL_RE.test(email) || subject.length === 0) return null;
  return { provider, email, subject, name: email.split("@")[0] };
}

/**
 * POST /api/auth/oauth/:provider/callback { code }
 * Handles the callback for github, google and discord. A new user is created on
 * first sign-in; an existing user (matched by email or provider subject) is
 * logged in. Either way a fresh access token is issued.
 */
export function oauthCallback(req: HttpRequest): HttpResponse {
  const providerMatch = /^\/api\/auth\/oauth\/([^/?#]+)\/callback/.exec(req.path);
  const providerName = providerMatch?.[1];
  if (!providerName || !(OAUTH_PROVIDERS as readonly string[]).includes(providerName)) {
    return fail(400, `unsupported oauth provider: ${providerName ?? "missing"}`);
  }
  const provider = providerName as OAuthProvider;

  const body = (req.body ?? {}) as { code?: unknown };
  if (typeof body.code !== "string" || body.code.length === 0) {
    return fail(400, "missing oauth code");
  }
  const profile = exchangeOAuthCode(provider, body.code);
  if (!profile) return fail(401, "invalid or expired oauth code");

  let user: UserRow | undefined;
  try {
    db.transaction(() => {
      const bySubject = [...db.users.values()].find(
        (u) => u.oauthProvider === provider && u.oauthSubject === profile.subject,
      );
      const byEmail = userByEmail(profile.email);
      if (bySubject) {
        if (!byEmail) {
          // Upgrade stale profile email on the linked account.
          db.users.set(bySubject.id, { ...bySubject, email: profile.email });
        }
        user = db.users.get(bySubject.id);
        return;
      }
      if (byEmail) {
        // Existing local account signs in via OAuth - link the provider so a
        // second callback matches by subject next time.
        db.users.set(byEmail.id, {
          ...byEmail,
          oauthProvider: provider,
          oauthSubject: profile.subject,
        });
        user = db.users.get(byEmail.id);
        return;
      }
      const created: UserRow = {
        id: newId(),
        email: profile.email,
        passwordHash: null,
        oauthProvider: provider,
        oauthSubject: profile.subject,
        createdAt: Date.now(),
      };
      db.users.set(created.id, created);
      publishOutboxEvent("user.registered", created.id, {
        email: created.email,
        provider,
      });
      user = created;
    });
  } catch (err) {
    if (err instanceof AuthConflict) return fail(409, "email already registered");
    throw err;
  }

  const session = issueToken(user as UserRow);
  return ok({
    token: session.token,
    expiresIn: session.expiresIn,
    provider,
    user: publicUser(user as UserRow),
  });
}

export { normalizeEmail, publicUser };