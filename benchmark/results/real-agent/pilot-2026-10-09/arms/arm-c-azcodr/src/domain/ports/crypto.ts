/**
 * Cryptographic ports (docs/rules/security_compliance.md): passwords must be
 * hashed with a memory-hard KDF (scrypt/Argon2id/bcrypt), never plaintext or
 * fast digests. Domain code depends only on these interfaces.
 */
export interface PasswordHasherPort {
  hash(plain: string): Promise<string>;
  verify(plain: string, stored: string): Promise<boolean>;
}