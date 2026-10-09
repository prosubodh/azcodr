import { db, newId } from "./db.ts";
import type { AuditRow } from "./db.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail, ok, queryParams } from "./types.ts";
import { authenticate } from "./auth.ts";
import { roleOf } from "./tenant.ts";

// ---------------------------------------------------------------------------
// Audit log (T08): workspace-scoped events, cursor-paginated newest-first.
// ---------------------------------------------------------------------------

export function writeAudit(
  workspaceId: string,
  actorId: string,
  action: string,
  details: Record<string, unknown> = {},
  createdAt: number = Date.now(),
): void {
  const id = newId();
  db.audits.set(id, {
    id,
    workspaceId,
    actorId,
    action,
    details: JSON.stringify(details),
    createdAt,
  });
}

export interface AuditCursor {
  createdAt: number;
  id: string;
}

export function encodeCursor(createdAt: number, id: string): string {
  return Buffer.from(`${createdAt}:${id}`, "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): AuditCursor | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const idx = decoded.lastIndexOf(":");
    if (idx <= 0) return null;
    const createdAt = Number(decoded.slice(0, idx));
    const id = decoded.slice(idx + 1);
    if (!Number.isFinite(createdAt) || id.length === 0) return null;
    return { createdAt, id };
  } catch {
    return null;
  }
}

/** True when record r is strictly older than the cursor position. */
function isStrictlyAfterCursor(r: AuditRow, c: AuditCursor): boolean {
  return r.createdAt < c.createdAt || (r.createdAt === c.createdAt && r.id < c.id);
}

const AUDIT_MAX_LIMIT = 100;

/**
 * GET /api/workspaces/:workspaceId/audit?limit&cursor
 * Returns { records, nextCursor }. Records are ordered by timestamp desc and
 * with a cursor only records strictly after it are returned.
 */
export function listAuditLogs(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const workspaceId = workspaceIdFromPath(req.path);
  if (!workspaceId) return fail(404, "workspace not found");

  const membership = roleOf(workspaceId, actorId);
  if (!membership) return fail(404, "workspace not found");
  if (membership.role === "Viewer") return fail(403, "viewer role cannot read the audit log");

  const query = queryParams(req.path);
  const limitRaw = query.get("limit");
  const limit = Math.min(Math.max(Number(limitRaw ?? AUDIT_MAX_LIMIT) || AUDIT_MAX_LIMIT, 1), AUDIT_MAX_LIMIT);

  const cursorRaw = query.get("cursor");
  const cursor = cursorRaw ? decodeCursor(cursorRaw) : null;
  if (cursorRaw && !cursor) return fail(400, "invalid cursor");

  const all = [...db.audits.values()].filter((row) => row.workspaceId === workspaceId);
  all.sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id));

  const filtered = cursor ? all.filter((row) => isStrictlyAfterCursor(row, cursor)) : all;
  const page = filtered.slice(0, limit);

  const records = page.map((row) => ({
    id: row.id,
    action: row.action,
    actorId: row.actorId,
    details: JSON.parse(row.details) as Record<string, unknown>,
    createdAt: row.createdAt,
  }));

  const nextCursor =
    page.length === limit && page.length > 0
      ? encodeCursor(page[page.length - 1].createdAt, page[page.length - 1].id)
      : null;

  return ok({ records, nextCursor });
}

/** Pull a workspace id out of a "/api/workspaces/:id/..." path. */
export function workspaceIdFromPath(path: string): string | null {
  const match = /^\/api\/workspaces\/([^/?#]+)/.exec(path.split("?")[0]);
  return match ? match[1] : null;
}

export type { AuditRow };