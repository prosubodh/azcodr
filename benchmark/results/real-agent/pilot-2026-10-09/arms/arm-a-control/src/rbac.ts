import { db, newId, userByEmail } from "./db.ts";
import type { MembershipRow, Role } from "./db.ts";
import { ROLES } from "./db.ts";
import { membersOf, roleOf } from "./tenant.ts";
import { featureState } from "./billing.ts";
import { writeAudit } from "./audit.ts";
import { publishOutboxEvent } from "./outbox.ts";
import { authenticate } from "./auth.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail, ok } from "./types.ts";

// ---------------------------------------------------------------------------
// T09 - Role-based access control.
//
// Roles: Owner > Admin > Member > Viewer. Handlers gate every action through
// requireRole(); nobody acts inside a workspace scope without a membership.
// ---------------------------------------------------------------------------

export function requireRole(
  workspaceId: string,
  userId: string,
  allowed: readonly Role[],
): MembershipRow | null {
  const membership = roleOf(workspaceId, userId);
  if (!membership) return null;
  return allowed.includes(membership.role) ? membership : null;
}

const MANAGERS: readonly Role[] = ["Owner", "Admin"];
const OWNERS: readonly Role[] = ["Owner"];

function workspaceIdFromPath(path: string): string | null {
  const match = /^\/api\/workspaces\/([^/?#]+)/.exec(path.split("?")[0]);
  return match ? match[1] : null;
}

function membersView(members: MembershipRow[]): Array<{ id: string; userId: string; email: string; role: Role }> {
  return members.map((m) => ({
    id: m.id,
    userId: m.userId,
    email: db.users.get(m.userId)?.email ?? "unknown",
    role: m.role,
  }));
}

/**
 * GET /api/workspaces/:workspaceId/members
 * Any member (including Viewer) can read the roster.
 */
export function listMembers(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const workspaceId = workspaceIdFromPath(req.path);
  if (!workspaceId || !roleOf(workspaceId, actorId)) {
    return fail(404, "workspace not found");
  }

  return ok({ members: membersView(membersOf(workspaceId)) });
}

/**
 * POST /api/workspaces/:workspaceId/members { email, role? }
 * Owner/Admin only: invites an existing user into the workspace as the given
 * role (default "Member"). Enforces the free-tier member limit via the billing
 * gate before adding anyone.
 */
export function inviteMember(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const workspaceId = workspaceIdFromPath(req.path);
  if (!workspaceId) return fail(404, "workspace not found");

  const manager = requireRole(workspaceId, actorId, MANAGERS);
  if (!manager) {
    const viewerOnly = roleOf(workspaceId, actorId);
    return fail(viewerOnly ? 403 : 404, "insufficient permissions to invite members");
  }

  const body = (req.body ?? {}) as { email?: unknown; role?: unknown };
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email) return fail(400, "email is required");

  const role = typeof body.role === "string" ? (body.role as Role) : "Member";
  if (!ROLES.includes(role)) {
    return fail(400, `role must be one of: ${ROLES.join(", ")}`);
  }

  const invitee = userByEmail(email);
  if (!invitee) return fail(404, "no user with that email");
  if (roleOf(workspaceId, invitee.id)) return fail(409, "user is already a member");

  // T05: reject invites past the workspace tier's member cap.
  const gate = featureState(workspaceId, "maxMembers");
  if (gate && !gate.allowed) {
    return fail(402, "workspace member limit reached for this plan", {
      feature: "maxMembers",
      limit: gate.limit,
      current: gate.current,
    });
  }

  let membership: MembershipRow | undefined;
  db.transaction(() => {
    const membershipId = newId();
    membership = {
      id: membershipId,
      workspaceId,
      userId: invitee.id,
      role,
      createdAt: Date.now(),
    };
    db.memberships.set(membershipId, membership);
    writeAudit(workspaceId, actorId, "member.invited", { email, role, userId: invitee.id });
    publishOutboxEvent("member.added", workspaceId, { email, role, userId: invitee.id });
  });

  return ok({ membership: membersView([membership as MembershipRow])[0] }, 201);
}

/**
 * DELETE /api/workspaces/:workspaceId/members/:userId
 * Owner/Admin only. The last Owner cannot remove the Owner role.
 */
export function removeMember(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const match = /^\/api\/workspaces\/([^/?#]+)\/members\/([^/?#]+)/.exec(req.path);
  if (!match) return fail(404, "not found");
  const workspaceId = match[1];
  const targetId = match[2];

  if (!requireRole(workspaceId, actorId, MANAGERS)) {
    return fail(roleOf(workspaceId, actorId) ? 403 : 404, "insufficient permissions");
  }
  if (!requireRole(workspaceId, actorId, OWNERS) && targetId === actorId) {
    return fail(403, "only an owner can remove themselves");
  }

  const target = roleOf(workspaceId, targetId);
  if (!target) return fail(404, "user is not a member");
  if (target.role === "Owner" && membersOf(workspaceId).filter((m) => m.role === "Owner").length <= 1) {
    return fail(400, "cannot remove the last workspace owner");
  }

  db.transaction(() => {
    db.memberships.delete(target.id);
    writeAudit(workspaceId, actorId, "member.removed", { userId: targetId, role: target.role });
  });

  return ok({ removed: targetId });
}