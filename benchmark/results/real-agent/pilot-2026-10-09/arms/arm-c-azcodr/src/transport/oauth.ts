import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import type { OAuthRegistryPort, OAuthProviderName } from '../domain/ports/oauth.ts';
import type { PasswordHasherPort } from '../domain/ports/crypto.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import type { OAuthAccountRepositoryPort, UserRepositoryPort } from '../domain/ports/repositories.ts';
import { oauthAuthorize, oauthCallback, type OAuthDeps } from '../application/oauth.ts';

export interface OAuthHandlersDeps {
  readonly registry: OAuthRegistryPort;
  readonly userRepository: UserRepositoryPort;
  readonly oauthAccountRepository: OAuthAccountRepositoryPort;
  readonly passwordHasher: PasswordHasherPort;
  readonly tokenSigner: TokenSignerPort;
}

export interface OAuthHandlers {
  readonly authorize: HttpHandler;
  readonly callback: HttpHandler;
}

interface ParsedOAuthPath {
  provider: OAuthProviderName;
  action: 'authorize' | 'callback';
  query: URLSearchParams;
}

/** /v1/oauth/:provider/{authorize|callback}?query */
function parseOAuthPath(path: string): ParsedOAuthPath | null {
  const [pathOnly, queryString] = path.split('?');
  const segments = (pathOnly ?? '').split('/').filter((s) => s.length > 0);
  if (segments.length !== 4 || segments[0] !== 'v1' || segments[1] !== 'oauth') return null;
  const action = segments[3];
  if (action !== 'authorize' && action !== 'callback') return null;
  return {
    provider: segments[2] as OAuthProviderName,
    action,
    query: new URLSearchParams(queryString ?? '')
  };
}

export function createOAuthHandlers(deps: OAuthHandlersDeps): OAuthHandlers {
  const appDeps: OAuthDeps = { ...deps };
  return {
    authorize: async (req) => {
      try {
        const parsed = parseOAuthPath(req.path);
        if (parsed === null) {
          return { status: 404, body: { code: 'NOT_FOUND', detail: 'Unknown endpoint.' } };
        }
        const state = parsed.query.get('state') ?? '';
        const authorizeUrl = await oauthAuthorize(appDeps, parsed.provider, state);
        return { status: 200, body: { authorizeUrl } };
      } catch (error) {
        return toProblem(error);
      }
    },
    callback: async (req) => {
      try {
        const parsed = parseOAuthPath(req.path);
        if (parsed === null) {
          return { status: 404, body: { code: 'NOT_FOUND', detail: 'Unknown endpoint.' } };
        }
        const code = parsed.query.get('code') ?? '';
        const result = await oauthCallback(appDeps, parsed.provider, code);
        return { status: 200, body: result };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}