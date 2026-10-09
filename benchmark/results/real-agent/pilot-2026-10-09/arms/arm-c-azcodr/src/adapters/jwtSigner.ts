import { createHmac, timingSafeEqual } from 'node:crypto';
import type { AccessTokenClaims, TokenSignerPort } from '../domain/ports/tokens.ts';

function toBase64Url(input: string | Buffer): string {
  return Buffer.from(input).toString('base64url');
}

function fromBase64Url(input: string): Buffer {
  return Buffer.from(input, 'base64url');
}

export interface JwtSignerOptions {
  /** HMAC secret — supplied by the composition root, never defaulted. */
  readonly secret: string;
  /** Access token lifetime in seconds (15 minutes for this platform). */
  readonly ttlSeconds?: number;
}

/**
 * Minimal RFC 7519 HS256 JWT adapter over node:crypto. Only an owned,
 * injectable port: no third-party JWT package needed for the scaffold.
 */
export function createJwtSigner({ secret, ttlSeconds }: JwtSignerOptions): TokenSignerPort {
  return {
    sign(claims) {
      const header = toBase64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      // Short-lived access tokens: stamp `exp` from the configured TTL (15 min).
      const payload = { ...claims };
      if (ttlSeconds !== undefined && ttlSeconds > 0) {
        payload.exp = claims.iat + ttlSeconds;
      }
      const body = toBase64Url(JSON.stringify(payload));
      const signature = createHmac('sha256', secret)
        .update(`${header}.${body}`)
        .digest('base64url');
      return `${header}.${body}.${signature}`;
    },
    verify(token) {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const header = parts[0];
      const body = parts[1];
      const signature = parts[2];
      if (header === undefined || body === undefined || signature === undefined) return null;
      const expected = createHmac('sha256', secret).update(`${header}.${body}`).digest();
      const provided = fromBase64Url(signature);
      if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) return null;
      try {
        const payload = JSON.parse(fromBase64Url(body).toString('utf8')) as Record<string, unknown>;
        if (typeof payload.sub !== 'string' || typeof payload.email !== 'string' || typeof payload.iat !== 'number') {
          return null;
        }
        const exp = typeof payload.exp === 'number' ? payload.exp : undefined;
        if (exp !== undefined && exp <= Math.floor(Date.now() / 1000)) return null;
        const claims: AccessTokenClaims =
          exp === undefined ? { sub: payload.sub, email: payload.email, iat: payload.iat } : { sub: payload.sub, email: payload.email, iat: payload.iat, exp };
        return claims;
      } catch {
        return null;
      }
    }
  };
}