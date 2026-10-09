import type { OAuthProviderName, OAuthProviderPort, OAuthRegistryPort } from '../../domain/ports/oauth.ts';
import { ValidationError } from '../../domain/errors.ts';

/**
 * Strategy registry (docs/rules/design_patterns.md): resolves a provider by
 * name so application code never branches over provider implementations.
 */
export function createOAuthRegistry(strategies: readonly OAuthProviderPort[]): OAuthRegistryPort {
  const byName = new Map<OAuthProviderName, OAuthProviderPort>();
  for (const strategy of strategies) {
    byName.set(strategy.provider, strategy);
  }
  return {
    get(provider: OAuthProviderName) {
      const strategy = byName.get(provider);
      if (strategy === undefined) {
        throw new ValidationError(`Unknown OAuth provider '${provider}'.`, 'UNKNOWN_OAUTH_PROVIDER');
      }
      return strategy;
    }
  };
}