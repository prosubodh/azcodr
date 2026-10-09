import type { UserId } from './ids.ts';
import { newId } from './ids.ts';
import { ValidationError } from './errors.ts';

/** Aggregate root for a registered member identity (Auth bounded context). */
export interface User {
  readonly id: UserId;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: string;
}

export interface NewUserInput {
  readonly email: string;
  readonly passwordHash: string;
}

function assertValidEmail(email: string): void {
  if (typeof email !== 'string' || email.length === 0 || !email.includes('@')) {
    throw new ValidationError('A valid email address is required.', 'INVALID_EMAIL');
  }
}

/** Factory guarding the registration invariant: email uniqueness is left to storage. */
export function createUser(input: NewUserInput): User {
  assertValidEmail(input.email);
  if (typeof input.passwordHash !== 'string' || input.passwordHash.length === 0) {
    throw new ValidationError('A password hash is required.', 'MISSING_PASSWORD_HASH');
  }
  return {
    id: newId('usr') as UserId,
    email: input.email,
    passwordHash: input.passwordHash,
    createdAt: new Date().toISOString()
  };
}