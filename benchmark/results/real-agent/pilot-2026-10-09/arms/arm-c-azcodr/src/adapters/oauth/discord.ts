import type { OAuthProfile, OAuthProviderConfig, OAuthProviderPort } from '../../domain/ports/oauth.ts';
import { ValidationError } from '../../domain/errors.ts';
import { extractAccessToken, nodeFetchJson, type HttpJson } from './core.ts';

/** Discord OAuth2 authorization-code strategy (docs/rules/authentication.md). */
export function createDiscordStrategy(config: OAuthProviderConfig, httpJson: HttpJson = nodeFetchJson): OAuthProviderPort {
  return {
    provider: 'discord',
    buildAuthorizeUrl(state) {
      const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: 'code',
        scope: 'identify email',
        state
      });
      return `https://discord.com/oauth2/authorize?${params.toString()}`;
    },
    async exchangeCode(code) {
      const body = new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.redirectUri,
        grant_type: 'authorization_code'
      }).toString();
      const tokenRaw = await httpJson('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body
      });
      const accessToken = extractAccessToken(tokenRaw);
      const profileRaw = (await httpJson('https://discord.com/api/users/@me', {
        headers: { Authorization: `Bearer ${accessToken}` }
      })) as { id?: string; email?: string; username?: string; global_name?: string | null };
      const email = profileRaw.email;
      if (typeof email !== 'string' || email.length === 0) {
        throw new ValidationError('The provider did not return an email address.', 'OAUTH_EMAIL_REQUIRED');
      }
      return {
        provider: 'discord',
        providerUserId: String(profileRaw.id ?? ''),
        email,
        displayName: profileRaw.global_name ?? profileRaw.username
      };
    }
  };
}