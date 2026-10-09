/**
 * T04 – Organization workspace entity and tenancy scoping.
 *
 * A workspace is created by a user who immediately becomes its Owner.
 * Every workspace query is scoped through membership: a user only ever sees
 * workspaces they belong to, and reads of other workspaces return 404 (the
 * existence of a foreign workspace is never leaked).
 *
 * Workspace creation runs inside a transaction with the outbox event
 * (T06) so the entity change and its `workspace.created` event commit together.
 */
import { randomBytes } from "node:crypto";
import { db, newId, nowIso, type Tx } from "./db.ts";
import { authenticate } from "./crypto.ts";
import { publishEvent } from "./outbox.ts";
import { recordAudit } from "./audit.ts";
import { HttpError, pathSegments, respond, type HttpRequest, type HttpResponse, type Role } from "./types.ts";

export type Plan = "free" | "pro";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  plan: Plan; // billing tier lives on the workspace (see billing.ts)
  createdBy: string;
  createdAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  createdAt: string;
}

const ROLE_RANK: Record<Role, number> = { Owner: 4, Admin: 3, Member: 2, Viewer: 1 };

export function roleAtLeast(actual: Role, required: Role): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[required];
}

export function getMembership(workspaceId: string, userId: string): WorkspaceMember | undefined {
  return db.findOne<WorkspaceMember>("workspaceMembers", (m) => m.workspaceId === workspaceId && m.userId === userId);
}

export function getWorkspaceById(id: string): Workspace | undefined {
  return db.find<Workspace>("workspaces", id);
}

export function listWorkspacesForUser(userId: string): Array<Workspace & { role: Role }> {
  const memberships = db
    .findAll<WorkspaceMember>("workspaceMembers")
    .filter((m) => m.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return memberships
    .map((m) => {
      const ws = getWorkspaceById(m.workspaceId);
      return ws ? { ...ws, role: m.role } : null;
    })
    .filter((w): w is Workspace & { role: Role } => w !== null);
}

export function listMembers(workspaceId: string): WorkspaceMember[] {
  return db
    .findAll<WorkspaceMember>("workspaceMembers")
    .filter((m) => m.workspaceId === workspaceId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (base || "workspace").slice(0, 40);
}

export function createWorkspace(params: { name: string; slug?: string; createdBy: string }): Workspace {
  const slug = `${slugify(params.slug ?? params.name)}-${randomBytes(3).toString("hex")}`;
  let workspace: Workspace | undefined;
  db.withTransaction<void>((tx: Tx) => {
    const ws: Workspace = {
      id: newId(),
      name: params.name,
      slug,
      plan: "free",
      createdBy: params.createdBy,
      createdAt: nowIso(),
    };
    tx.insert("workspaces", ws);
    tx.insert<WorkspaceMember>("workspaceMembers", {
      id: newId(),
      workspaceId: ws.id,
      userId: params.createdBy,
      role: "Owner",
      createdAt: nowIso(),
    });
    publishEvent(tx, {
      aggregateType: "workspace",
      aggregateId: ws.id,
      type: "workspace.created",
      payload: { workspaceId: ws.id, name: ws.name, slug: ws.slug, createdBy: params.createdBy },
    });
    workspace = ws;
  });
  recordAudit({
    workspaceId: workspace!.id,
    actorId: params.createdBy,
    action: "workspace.created",
    meta: { name: workspace!.name },
  });
  return workspace!;
}

export async function handleWorkspaces(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "workspaces") throw new HttpError(404, "not found");
    const actor = authenticate(req.headers);
    const method = req.method.toUpperCase();

    if (method === "POST" && seg.length === 2) {
      const body = (req.body ?? {}) as { name?: unknown; slug?: unknown };
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name) throw new HttpError(400, "name is required");
      const slug = typeof body.slug === "string" && body.slug.trim() ? body.slug.trim() : undefined;
      const workspace = createWorkspace({ name, slug, createdBy: actor.userId });
      return { status: 201, body: { workspace: { ...workspace, role: "Owner" } } };
    }

    if (method === "GET" && seg.length === 2) {
      // Tenancy: only workspaces the caller belongs to.
      return { status: 200, body: { workspaces: listWorkspacesForUser(actor.userId) } };
    }

    if (seg.length === 3) {
      const workspaceId = seg[2];
      const membership = getMembership(workspaceId, actor.userId);
      if (!membership) throw new HttpError(404, "workspace not found");
      const ws = getWorkspaceById(workspaceId);
      if (!ws) throw new HttpError(404, "workspace not found");
      if (method === "GET") {
        return { status: 200, body: { workspace: { ...ws, role: membership.role } } };
      }
      throw new HttpError(405, "method not allowed");
    }

    if (seg.length === 5 && seg[3] === "members") {
      // PUT /api/workspaces/:id/members/:userId  -> change another member's role
      const workspaceId = seg[2];
      const targetUserId = seg[4];
      const caller = getMembership(workspaceId, actor.userId);
      if (!caller) throw new HttpError(404, "workspace not found");
      if (caller.role !== "Owner") throw new HttpError(403, "only the workspace owner can change roles");

      if (method === "PUT") {
        const body = (req.body ?? {}) as { role?: unknown };
        const target = getMembership(workspaceId, targetUserId);
        if (!target) throw new HttpError(404, "member not found");
        const role = body.role;
        if (role !== "Admin" && role !== "Member" && role !== "Viewer") {
          throw new HttpError(400, "role must be Admin, Member or Viewer");
        }
        const updated = db.update<WorkspaceMember>("workspaceMembers", target.id, { role });
        recordAudit({
          workspaceId,
          actorId: actor.userId,
          action: "member.role_changed",
          targetId: targetUserId,
          meta: { role },
        });
        return { status: 200, body: { member: updated } };
      }
      throw new HttpError(405, "method not allowed");
    }

    throw new HttpError(404, "not found");
  });
}