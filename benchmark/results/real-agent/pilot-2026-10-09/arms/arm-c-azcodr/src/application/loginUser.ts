import type { UserRepositoryPort } from '../domain/ports/repositories.ts';
import type { PasswordHasherPort } from '../domain/ports/crypto.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import { UnauthorizedError } from '../domain/errors.ts';

export interface LoginUserDeps {
  readonly userRepository: UserRepositoryPort;
  readonly passwordHasher: PasswordHasherPort;
  readonly tokenSigner: TokenSignerPort;
  readonly nowSeconds?: () => number;
}

export interface LoginUserCommand {
  readonly email: string;
  readonly password: string;
}

export interface LoginUserResult {
  readonly accessToken: string;
}

/**
 * Login use case: verifies credentials and issues a short-lived access token.
 * Both unknown email and wrong password return 401 (enumeration masking).
 */
export async function loginUser(
  deps: LoginUserDeps,
  command: LoginUserCommand
): Promise<LoginUserResult> {
  const user = await deps.userRepository.findByEmail(command.email);
  if (user === null) {
    throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  const passwordMatches = await deps.passwordHasher.verify(command.password, user.passwordHash);
  if (!passwordMatches) {
    throw new UnauthorizedError('Invalid email or password.', 'INVALID_CREDENTIALS');
  }
  const now = deps.nowSeconds ? deps.nowSeconds() : Math.floor(Date.now() / 1000);
  const accessToken = deps.tokenSigner.sign({ sub: user.id, email: user.email, iat: now });
  return { accessToken };
}