import type { OAuthProfile, OAuthProviderConfig, OAuthProviderPort } from '../../domain/ports/oauth.ts';
import { ValidationError } from '../../domain/errors.ts';
import { extractAccessToken, nodeFetchJson, type HttpJson } from './core.ts';

/** GitHub OAuth2 authorization-code strategy (docs/rules/authentication.md). */
export function createGithubStrategy(config: OAuthProviderConfig, httpJson: HttpJson = nodeFetchJson): OAuthProviderPort {
  return {
    provider: 'github',
    buildAuthorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        state,
        scope: 'read:user user:email'
      });
      return `https://github.com/login/oauth/authorize?${params.toString()}`;
    },
    async exchangeCode(code) {
      const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri
      }).toString();
      const tokenRaw = await httpJson('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const accessToken = extractAccessToken(tokenRaw);
      const profileRaw = (await httpJson('https://api.github.com/user', {
        headers: { Authorization: `Bearer ${accessToken}`, 'User-Agent': 'azcodr-pilot' }
      })) as { id?: number | string; email?: string | null; login?: string; name?: string | null };
      const email = profileRaw.email ?? null;
      if (typeof email !== 'string' || email.length === 0) {
        throw new ValidationError('The provider did not return an email address.', 'OAUTH_EMAIL_REQUIRED');
      }
      const result: OAuthProfile = {
        provider: 'github',
        providerUserId: String(profileRaw.id ?? ''),
        email,
        displayName: profileRaw.name ?? profileRaw.login
      };
      return result;
    }
  };
}