import { randomUUID } from 'node:crypto';

/** Branded nominal id: prevents mixing entity ids across domain boundaries. */
export type UserId = string & { readonly __brand: unique symbol };
export type WorkspaceId = string & { readonly __brand: unique symbol };
export type MembershipId = string & { readonly __brand: unique symbol };

/** Generator for domain identifiers. */
export function newId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}