import { newId, type UserId, type WorkspaceId } from './ids.ts';

/** Canonical audit trail action vocabulary. */
export type AuditAction = 'WorkspaceCreated' | 'MemberInvited' | 'MemberRoleChanged';

/**
 * Append-only audit record for a tenant. Immutable once written; ordering is
 * (occurredAt DESC, id) so pagination is stable across ties.
 */
export interface AuditEntry {
  readonly id: string;
  readonly workspaceId: WorkspaceId;
  readonly actorUserId: UserId | null;
  readonly action: string;
  readonly occurredAt: string;
  readonly details: Record<string, unknown>;
}

export interface NewAuditEntry {
  readonly workspaceId: WorkspaceId;
  readonly actorUserId?: UserId | null;
  readonly action: string;
  readonly occurredAt?: string;
  readonly details?: Record<string, unknown>;
}

export function createAuditEntry(input: NewAuditEntry): AuditEntry {
  return {
    id: newId('aud'),
    workspaceId: input.workspaceId,
    actorUserId: input.actorUserId ?? null,
    action: input.action,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
    details: { ...(input.details ?? {}) }
  };
}