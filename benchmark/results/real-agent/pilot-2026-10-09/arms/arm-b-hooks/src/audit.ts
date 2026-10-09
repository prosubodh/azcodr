/**
 * Audit log with cursor-based pagination (T08).
 * Records are ordered by timestamp descending (tie-broken by id descending);
 * a cursor resumes strictly after the record it points at.
 */
import { db, newId, nowIso } from "./db.ts";
import { authenticate } from "./crypto.ts";
import { HttpError, pathSegments, queryParam, respond, type HttpRequest, type HttpResponse } from "./types.ts";

export interface AuditEntry {
  id: string;
  /** Monotonic insertion order (deterministic "newest first" even when timestamps collide). */
  seq: number;
  workspaceId: string;
  actorId: string;
  action: string;
  targetId?: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

let auditSeq = 0;

export function recordAudit(
  entry: Omit<AuditEntry, "id" | "seq" | "createdAt">,
): AuditEntry {
  const row: AuditEntry = {
    ...entry,
    meta: entry.meta ?? {},
    id: newId(),
    seq: ++auditSeq,
    createdAt: nowIso(),
  };
  db.insert("auditLog", row);
  return row;
}

function encodeCursor(entry: AuditEntry): string {
  return Buffer.from(JSON.stringify({ seq: entry.seq, t: entry.createdAt, id: entry.id })).toString("base64url");
}

function decodeCursor(cursor: string): { seq: number } {
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as {
      seq?: unknown;
    };
    if (typeof parsed.seq !== "number" || !Number.isInteger(parsed.seq)) throw new Error("bad cursor");
    return { seq: parsed.seq };
  } catch (err) {
    throw new HttpError(400, "invalid cursor");
  }
}

export interface AuditPage {
  records: AuditEntry[];
  nextCursor: string | null;
}

/** Returns entries for a workspace newest-first (by seq desc), strictly after the cursor. */
export function listAuditLog(
  workspaceId: string,
  opts: { limit?: number; cursor?: string } = {},
): AuditPage {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 100);
  const entries = db
    .findAll<AuditEntry>("auditLog")
    .filter((e) => e.workspaceId === workspaceId)
    .sort((a, b) => b.seq - a.seq);

  const cursor = opts.cursor ? decodeCursor(opts.cursor) : null;
  const filtered = cursor
    ? entries.filter((e) => e.seq < cursor.seq) // strictly older than the cursor point
    : entries;

  const records = filtered.slice(0, limit);
  const nextCursor = records.length === limit && filtered.length > limit ? encodeCursor(records[records.length - 1]) : null;
  return { records, nextCursor };
}

export async function handleAudit(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "audit") throw new HttpError(404, "not found");
    if (req.method.toUpperCase() !== "GET") throw new HttpError(405, "method not allowed");

    const actor = authenticate(req.headers);
    const workspaceId = queryParam(req.path, "workspaceId");
    if (!workspaceId) throw new HttpError(400, "workspaceId query parameter is required");

    // Tenancy: caller must be a member of the workspace being read.
    // (queried directly here to keep this module dependency-free of tenant.ts)
    const membership = db.findOne("workspaceMembers", (m: any) => m.workspaceId === workspaceId && m.userId === actor.userId);
    if (!membership) throw new HttpError(404, "workspace not found");

    const limitRaw = queryParam(req.path, "limit");
    const limit = limitRaw ? Number.parseInt(limitRaw, 10) : 50;
    const cursor = queryParam(req.path, "cursor") ?? undefined;

    const page = listAuditLog(workspaceId, { limit, cursor });
    return { status: 200, body: page };
  });
}