import type { AuditRepositoryPort, AuditCursor, MembershipRepositoryPort } from '../domain/ports/repositories.ts';
import type { AuditEntry } from '../domain/audit.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { NotFoundError, ValidationError } from '../domain/errors.ts';

export interface AuditDeps {
  readonly auditRepository: AuditRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
}

export interface ListAuditQuery {
  readonly workspaceId: WorkspaceId;
  readonly actorUserId: UserId;
  readonly cursor?: string;
  readonly limit?: number;
}

export interface AuditPage {
  readonly records: AuditEntry[];
  readonly nextCursor: string | null;
}

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;
const CURSOR_SEPARATOR = '::';

/**
 * Tenant-scoped audit listing with opaque cursor pagination (keyset over
 * occurredAt DESC, id). The cursor is strictly-after: the returned page
 * contains only records older than the boundary record of the previous page,
 * so pagination never skips or duplicates entries.
 */
export async function listAuditForWorkspace(deps: AuditDeps, query: ListAuditQuery): Promise<AuditPage> {
  const membership = await deps.membershipRepository.findByUserAndWorkspace(query.actorUserId, query.workspaceId);
  if (membership === null) {
    throw new NotFoundError('Workspace not found.', 'WORKSPACE_NOT_FOUND');
  }
  const limit = clampLimit(query.limit);
  const after = query.cursor === undefined || query.cursor === '' ? null : decodeCursor(query.cursor);
  const { records, more } = await deps.auditRepository.listByWorkspace(query.workspaceId, after, limit);
  const last = records[records.length - 1];
  return { records, nextCursor: more && last !== undefined ? encodeCursor(last) : null };
}

function clampLimit(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value) || value < 1) return DEFAULT_LIMIT;
  return Math.min(Math.floor(value), MAX_LIMIT);
}

function decodeCursor(cursor: string): AuditCursor {
  try {
    const text = Buffer.from(cursor, 'base64url').toString('utf8');
    const separator = text.indexOf(CURSOR_SEPARATOR);
    if (separator === -1) throw new Error('malformed cursor');
    const occurredAt = text.slice(0, separator);
    const id = text.slice(separator + CURSOR_SEPARATOR.length);
    if (occurredAt.length === 0 || id.length === 0) throw new Error('malformed cursor');
    return { occurredAt, id };
  } catch {
    throw new ValidationError('The pagination cursor is invalid.', 'INVALID_CURSOR');
  }
}

function encodeCursor(entry: AuditEntry): string {
  return Buffer.from(`${entry.occurredAt}${CURSOR_SEPARATOR}${entry.id}`).toString('base64url');
}