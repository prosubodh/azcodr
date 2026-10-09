import type { TokenSignerPort, AccessTokenClaims } from '../domain/ports/tokens.ts';
import { UnauthorizedError } from '../domain/errors.ts';

export interface AuthGuardDeps {
  readonly tokenSigner: TokenSignerPort;
}

/**
 * Authorization-style PEP (docs/rules/authorization.md): resolves the caller
 * from the Bearer token before any domain logic executes.
 */
export async function requireUser(deps: AuthGuardDeps, headers: Record<string, string | string[] | undefined>): Promise<AccessTokenClaims> {
  const header = headers['authorization'];
  const token = typeof header === 'string' ? header.replace(/^Bearer\s+/i, '') : '';
  const claims = deps.tokenSigner.verify(token);
  if (claims === null) {
    throw new UnauthorizedError('A valid access token is required.', 'MISSING_OR_INVALID_TOKEN');
  }
  return claims;
}