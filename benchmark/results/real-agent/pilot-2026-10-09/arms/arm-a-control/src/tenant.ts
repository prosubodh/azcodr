import { db, newId } from "./db.ts";
import type { MembershipRow, Role, WorkspaceRow } from "./db.ts";
import { publishOutboxEvent } from "./outbox.ts";
import { writeAudit } from "./audit.ts";
import { authenticate } from "./auth.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail, ok } from "./types.ts";

// ---------------------------------------------------------------------------
// T04 - Organization workspaces with tenancy scoping.
//
// Every workspace query is partitioned strictly by workspaceId: a user can
// only see workspaces they hold a membership in, and memberships inside a
// workspace are visible only through that workspace's scope.
// ---------------------------------------------------------------------------

export function roleOf(workspaceId: string, userId: string): MembershipRow | null {
  for (const membership of db.memberships.values()) {
    if (membership.workspaceId === workspaceId && membership.userId === userId) {
      return membership;
    }
  }
  return null;
}

export function isMember(workspaceId: string, userId: string): boolean {
  return roleOf(workspaceId, userId) !== null;
}

export function getWorkspaceRow(workspaceId: string): WorkspaceRow | null {
  return db.workspaces.get(workspaceId) ?? null;
}

export function membersOf(workspaceId: string): MembershipRow[] {
  return [...db.memberships.values()].filter((m) => m.workspaceId === workspaceId);
}

function workspaceIdFromPath(path: string): string | null {
  const match = /^\/api\/workspaces\/([^/?#]+)/.exec(path.split("?")[0]);
  return match ? match[1] : null;
}

function publicWorkspace(
  workspace: WorkspaceRow,
  myRole: Role | undefined,
  memberCount: number,
) {
  const subscription = db.subscriptions.get(workspace.id);
  return {
    id: workspace.id,
    name: workspace.name,
    ownerId: workspace.ownerId,
    myRole: myRole ?? null,
    memberCount,
    tier: subscription?.tier ?? "free",
    createdAt: workspace.createdAt,
  };
}

/**
 * POST /api/workspaces { name }
 * The creator becomes the workspace Owner. Subscription (free tier) and the
 * audit + outbox events are written atomically.
 */
export function createWorkspace(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const body = (req.body ?? {}) as { name?: unknown };
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return fail(400, "workspace name is required");

  let workspace: WorkspaceRow | undefined;
  db.transaction(() => {
    workspace = {
      id: newId(),
      name,
      ownerId: actorId,
      createdAt: Date.now(),
    };
    db.workspaces.set(workspace.id, workspace);

    const ownerMembershipId = newId();
    db.memberships.set(ownerMembershipId, {
      id: ownerMembershipId,
      workspaceId: workspace.id,
      userId: actorId,
      role: "Owner",
      createdAt: Date.now(),
    });

    db.subscriptions.set(workspace.id, {
      workspaceId: workspace.id,
      tier: "free",
      status: "active",
      stripeCustomerId: null,
      updatedAt: Date.now(),
    });

    writeAudit(workspace.id, actorId, "workspace.created", { name });
    publishOutboxEvent("workspace.created", workspace.id, { name, ownerId: actorId });
  });

  return ok(
    { workspace: publicWorkspace(workspace as WorkspaceRow, "Owner", 1) },
    201,
  );
}

/**
 * GET /api/workspaces
 * Tenancy scope: returns only workspaces the caller belongs to.
 */
export function listWorkspaces(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const memberships = [...db.memberships.values()].filter((m) => m.userId === actorId);
  const workspaces = memberships.map((membership) => {
    const ws = db.workspaces.get(membership.workspaceId);
    if (!ws) return null;
    return publicWorkspace(ws, membership.role, membersOf(ws.id).length);
  });
  const visible = workspaces.filter((ws): ws is NonNullable<typeof ws> => ws !== null);
  visible.sort((a, b) => a.createdAt - b.createdAt);

  return ok({ workspaces: visible });
}

/**
 * GET /api/workspaces/:workspaceId
 * Strict partition by workspaceId: non-members get 404 (no existence leak).
 */
export function getWorkspace(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const workspaceId = workspaceIdFromPath(req.path);
  if (!workspaceId) return fail(404, "workspace not found");

  const workspace = getWorkspaceRow(workspaceId);
  const membership = roleOf(workspaceId, actorId);
  if (!workspace || !membership) return fail(404, "workspace not found");

  return ok({
    workspace: publicWorkspace(workspace, membership.role, membersOf(workspaceId).length),
  });
}