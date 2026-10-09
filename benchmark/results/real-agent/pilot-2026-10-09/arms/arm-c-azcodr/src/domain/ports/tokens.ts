/** Access token claims issued at login (RFC 7519 JWT claims subset). */
export interface AccessTokenClaims {
  readonly sub: string;
  readonly email: string;
  readonly iat: number;
  readonly exp?: number;
}

/**
 * Token port: application depends on signing/verifying access tokens without
 * touching crypto. Adapters implement the actual JWT/HMAC mechanics.
 */
export interface TokenSignerPort {
  sign(claims: AccessTokenClaims): string;
  verify(token: string): AccessTokenClaims | null;
}