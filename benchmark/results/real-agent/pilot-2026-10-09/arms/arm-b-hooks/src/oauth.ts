/**
 * T03 – Multi-provider OAuth integration (GitHub, Google, Discord).
 *
 * Simulated end-to-end within the request/response model:
 *  - `/oauth/:provider/authorize` issues a state nonce and returns the
 *    provider authorization URL (redirect target).
 *  - `/oauth/:provider/callback` exchanges the authorization `code` for a
 *    provider profile, upserts the local user, and issues an access token.
 *
 * The provider token exchange is faked (`exchangeCode`) since there is no real
 * network I/O in this exercise; the flow still exercises state validation,
 * one-time code consumption, and account upsert/linking.
 */
import { randomBytes } from "node:crypto";
import { db, newId, nowIso } from "./db.ts";
import { signToken } from "./crypto.ts";
import { HttpError, pathSegments, respond, type HttpRequest, type HttpResponse } from "./types.ts";
import type { User } from "./auth.ts";

export type OAuthProvider = "github" | "google" | "discord";

interface ProviderConfig {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  scopes: string[];
}

const PROVIDERS: Record<OAuthProvider, ProviderConfig> = {
  github: {
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    clientId: "gh_client_id",
    scopes: ["read:user", "user:email"],
  },
  google: {
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    clientId: "google_client_id",
    scopes: ["openid", "email", "profile"],
  },
  discord: {
    authorizeUrl: "https://discord.com/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    clientId: "discord_client_id",
    scopes: ["identify", "email"],
  },
};

const STATE_TTL_MS = 10 * 60 * 1000;

interface PendingAuthorization {
  id: string; // the state nonce
  provider: OAuthProvider;
  redirectUri: string;
  createdAt: string;
}

interface ProviderProfile {
  providerId: string; // provider-scoped subject id
  email: string;
  name: string;
}

// ---- fake provider token exchange ----

export function makeOAuthCode(profile: { sub: string; email: string; name: string }): string {
  return Buffer.from(JSON.stringify(profile)).toString("base64url");
}

function exchangeCode(provider: OAuthProvider, code: string): ProviderProfile {
  let profile: { sub?: unknown; email?: unknown; name?: unknown };
  try {
    profile = JSON.parse(Buffer.from(code, "base64url").toString("utf8"));
  } catch {
    throw new HttpError(400, "invalid authorization code");
  }
  if (typeof profile.sub !== "string" || typeof profile.email !== "string" || typeof profile.name !== "string") {
    throw new HttpError(400, "invalid authorization code");
  }
  return {
    providerId: `${provider}:${profile.sub}`,
    email: profile.email.toLowerCase(),
    name: profile.name,
  };
}

// ---- flows ----

export async function oauthAuthorizeRequest(
  provider: OAuthProvider,
  req: HttpRequest,
): Promise<HttpResponse> {
  return respond(async () => {
    const config = PROVIDERS[provider];
    const state = randomBytes(16).toString("hex");
    db.insert("pendingOAuth", {
      id: state,
      provider,
      redirectUri: `http://localhost:3000/oauth/${provider}/callback`,
      createdAt: nowIso(),
    } satisfies PendingAuthorization);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: `http://localhost:3000/oauth/${provider}/callback`,
      response_type: "code",
      scope: config.scopes.join(" "),
      state,
    });
    return {
      status: 200,
      body: { provider, url: `${config.authorizeUrl}?${params.toString()}`, state },
    };
  });
}

export async function oauthCallbackRequest(
  provider: OAuthProvider,
  req: HttpRequest,
): Promise<HttpResponse> {
  return respond(async () => {
    let code: string | null = null;
    let state: string | null = null;
    if (req.body && typeof req.body === "object") {
      const b = req.body as Record<string, unknown>;
      code = typeof b.code === "string" ? b.code : null;
      state = typeof b.state === "string" ? b.state : null;
    }
    const url = new URL(req.path, "http://localhost");
    code = code ?? url.searchParams.get("code");
    state = state ?? url.searchParams.get("state");
    if (!code || !state) throw new HttpError(400, "code and state are required");

    const pending = db.findOne<PendingAuthorization>("pendingOAuth", (p) => p.id === state);
    if (!pending || pending.provider !== provider) throw new HttpError(401, "invalid state");
    const issuedAt = Date.parse(pending.createdAt);
    if (Number.isNaN(issuedAt) || Date.now() - issuedAt > STATE_TTL_MS) {
      throw new HttpError(401, "state expired");
    }
    db.remove("pendingOAuth", state); // one-time use

    const profile = exchangeCode(provider, code);

    // Upsert: link by existing provider account, else by email, else create.
    let user = db.findOne<User>("users", (u) => u.oauth?.[provider]?.providerId === profile.providerId);
    if (!user) user = db.findOne<User>("users", (u) => u.email === profile.email);

    if (user) {
      const accounts = { ...(user.oauth ?? {}) };
      accounts[provider] = { providerId: profile.providerId, name: profile.name };
      db.update<User>("users", user.id, { oauth: accounts });
    } else {
      user = {
        id: newId(),
        email: profile.email,
        passwordHash: null,
        createdAt: nowIso(),
        oauth: { [provider]: { providerId: profile.providerId, name: profile.name } },
      };
      db.insert("users", user);
    }

    return {
      status: 200,
      body: {
        provider,
        accessToken: signToken({ sub: user.id, email: user.email }),
        tokenType: "Bearer",
        expiresIn: 15 * 60,
        user: { id: user.id, email: user.email, name: profile.name },
      },
    };
  });
}

export async function handleOAuth(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "oauth" || seg.length < 3) throw new HttpError(404, "not found");
    const provider = seg[1] as OAuthProvider;
    if (!(provider in PROVIDERS)) throw new HttpError(404, "unknown oauth provider");
    const flow = seg[2];
    if (flow === "authorize") return oauthAuthorizeRequest(provider, req);
    if (flow === "callback") return oauthCallbackRequest(provider, req);
    throw new HttpError(404, "not found");
  });
}