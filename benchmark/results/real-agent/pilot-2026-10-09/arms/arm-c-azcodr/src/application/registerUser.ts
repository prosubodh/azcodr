import type { UserRepositoryPort } from '../domain/ports/repositories.ts';
import type { PasswordHasherPort } from '../domain/ports/crypto.ts';
import { createUser } from '../domain/user.ts';
import { ConflictError } from '../domain/errors.ts';

export interface RegisterUserDeps {
  readonly userRepository: UserRepositoryPort;
  readonly passwordHasher: PasswordHasherPort;
}

export interface RegisterUserCommand {
  readonly email: string;
  readonly password: string;
}

export interface RegisterUserResult {
  readonly id: string;
  readonly email: string;
}

/**
 * Registration use case. Persists the user with a hashed password and fails
 * with 409 when the email is already taken.
 */
export async function registerUser(
  deps: RegisterUserDeps,
  command: RegisterUserCommand
): Promise<RegisterUserResult> {
  const existing = await deps.userRepository.findByEmail(command.email);
  if (existing !== null) {
    throw new ConflictError('An account with this email already exists.', 'EMAIL_TAKEN');
  }
  // Hash the password with the injected scrypt hasher: stored value is never plaintext.
  const passwordHash = await deps.passwordHasher.hash(command.password);
  const user = createUser({ email: command.email, passwordHash });
  await deps.userRepository.create(user);
  return { id: user.id, email: user.email };
}