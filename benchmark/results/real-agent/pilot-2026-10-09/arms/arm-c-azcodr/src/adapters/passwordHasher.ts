import { scrypt as scryptCallback, randomBytes, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import type { PasswordHasherPort } from '../domain/ports/crypto.ts';

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 64;
const SALT_BYTES = 16;
const PREFIX = 'scrypt';

/** node:crypto scrypt adapter implementing the PasswordHasherPort. */
export const scryptPasswordHasher: PasswordHasherPort = {
  async hash(plain) {
    const salt = randomBytes(SALT_BYTES);
    const derived = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer;
    return `${PREFIX}:${salt.toString('hex')}:${derived.toString('hex')}`;
  },
  async verify(plain, stored) {
    const parts = stored.split(':');
    if (parts.length !== 3 || parts[0] !== PREFIX) return false;
    const salt = Buffer.from(parts[1] ?? '', 'hex');
    const expected = Buffer.from(parts[2] ?? '', 'hex');
    const derived = (await scrypt(plain, salt, KEY_LENGTH)) as Buffer;
    return derived.length === expected.length && timingSafeEqual(derived, expected);
  }
};