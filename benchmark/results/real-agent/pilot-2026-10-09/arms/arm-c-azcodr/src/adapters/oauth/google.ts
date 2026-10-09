import type { OAuthProfile, OAuthProviderConfig, OAuthProviderPort } from '../../domain/ports/oauth.ts';
import { ValidationError } from '../../domain/errors.ts';
import { extractAccessToken, nodeFetchJson, type HttpJson } from './core.ts';

/** Google OAuth2 authorization-code strategy (docs/rules/authentication.md). */
export function createGoogleStrategy(config: OAuthProviderConfig, httpJson: HttpJson = nodeFetchJson): OAuthProviderPort {
  return {
    provider: 'google',
    buildAuthorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'openid email profile',
        state
      });
      return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    },
    async exchangeCode(code) {
      const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      }).toString();
      const tokenRaw = await httpJson('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const accessToken = extractAccessToken(tokenRaw);
      const profileRaw = (await httpJson('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })) as { sub?: string; email?: string; name?: string };
      const email = profileRaw.email;
      if (typeof email !== 'string' || email.length === 0) {
        throw new ValidationError('The provider did not return an email address.', 'OAUTH_EMAIL_REQUIRED');
      }
      return {
        provider: 'google',
        providerUserId: String(profileRaw.sub ?? ''),
        email,
        displayName: profileRaw.name
      };
    }
  };
}