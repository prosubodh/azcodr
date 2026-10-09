import { randomBytes } from 'node:crypto';
import type { OAuthAccountRepositoryPort, UserRepositoryPort } from '../domain/ports/repositories.ts';
import type { OAuthProviderName, OAuthRegistryPort } from '../domain/ports/oauth.ts';
import type { PasswordHasherPort } from '../domain/ports/crypto.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import { createUser } from '../domain/user.ts';
import { NotFoundError } from '../domain/errors.ts';
import type { LoginUserResult } from './loginUser.ts';

export interface OAuthDeps {
  readonly registry: OAuthRegistryPort;
  readonly userRepository: UserRepositoryPort;
  readonly oauthAccountRepository: OAuthAccountRepositoryPort;
  readonly passwordHasher: PasswordHasherPort;
  readonly tokenSigner: TokenSignerPort;
  readonly nowSeconds?: () => number;
}

/** Start of the authorization-code flow: returns the provider's authorize URL. */
export async function oauthAuthorize(deps: OAuthDeps, provider: OAuthProviderName, state: string): Promise<string> {
  const strategy = deps.registry.get(provider);
  return strategy.buildAuthorizeUrl(state);
}

/** Callback leg: exchange the code, link or create the local user, issue a token. */
export async function oauthCallback(deps: OAuthDeps, provider: OAuthProviderName, code: string): Promise<LoginUserResult> {
  const strategy = deps.registry.get(provider);
  const profile = await strategy.exchangeCode(code);

  const existingAccount = await deps.oauthAccountRepository.findByProviderSubject(provider, profile.providerUserId);
  if (existingAccount !== null) {
    const user = await deps.userRepository.findByEmail(existingAccount.email);
    if (user === null) {
      throw new NotFoundError('Linked account no longer exists.', 'USER_NOT_FOUND');
    }
    return issueToken(deps, user.id, user.email);
  }

  // New identity: link to an existing local user when the email is already
  // registered; otherwise create the user with an unusable random password.
  let user = await deps.userRepository.findByEmail(profile.email);
  if (user === null) {
    const unusablePassword = randomBytes(32).toString('hex');
    user = createUser({
      email: profile.email,
      passwordHash: await deps.passwordHasher.hash(unusablePassword)
    });
    await deps.userRepository.create(user);
  }
  await deps.oauthAccountRepository.create({
    id: `oac_${randomBytes(12).toString('hex')}`,
    provider,
    providerUserId: profile.providerUserId,
    userId: user.id,
    email: profile.email,
    createdAt: new Date().toISOString()
  });
  return issueToken(deps, user.id, user.email);
}

function issueToken(deps: OAuthDeps, userId: string, email: string): LoginUserResult {
  const now = deps.nowSeconds ? deps.nowSeconds() : Math.floor(Date.now() / 1000);
  return { accessToken: deps.tokenSigner.sign({ sub: userId, email, iat: now }) };
}