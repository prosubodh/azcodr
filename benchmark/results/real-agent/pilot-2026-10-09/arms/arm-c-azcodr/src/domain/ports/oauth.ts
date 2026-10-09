export type OAuthProviderName = 'github' | 'google' | 'discord';

/** Normalized provider profile in the platform's own Ubiquitous Language. */
export interface OAuthProfile {
  readonly provider: OAuthProviderName;
  readonly providerUserId: string;
  readonly email: string;
  readonly displayName?: string;
}

export interface OAuthProviderConfig {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
}

/** One provider strategy; the registry serves the family (Strategy pattern). */
export interface OAuthProviderPort {
  readonly provider: OAuthProviderName;
  buildAuthorizeUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthProfile>;
}

/** Registry port: application resolves strategies by name, never branches inline. */
export interface OAuthRegistryPort {
  get(provider: OAuthProviderName): OAuthProviderPort;
}