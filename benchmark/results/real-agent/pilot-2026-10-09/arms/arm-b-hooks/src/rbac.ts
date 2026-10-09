/**
 * T09 – Role-based access control policy guard.
 *
 * Guards workspace actions against the caller's membership role
 * (Owner > Admin > Member > Viewer, see tenant.ts). Inviting members requires
 * at least `Admin`; anything below that gets a 403.
 */
import { db, newId, nowIso } from "./db.ts";
import { authenticate } from "./crypto.ts";
import { getMembership, listMembers, roleAtLeast, type WorkspaceMember } from "./tenant.ts";
import { findUserByEmail } from "./auth.ts";
import { recordAudit } from "./audit.ts";
import { HttpError, pathSegments, respond, type HttpRequest, type HttpResponse, type Role } from "./types.ts";

const INVITABLE_ROLES: Role[] = ["Admin", "Member", "Viewer"];

function assertRole(workspaceId: string, userId: string, required: Role): WorkspaceMember {
  const membership = getMembership(workspaceId, userId);
  if (!membership) throw new HttpError(404, "workspace not found");
  if (!roleAtLeast(membership.role, required)) {
    throw new HttpError(403, `requires role '${required}' or higher`);
  }
  return membership;
}

export async function handleRbac(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "workspaces" || seg.length !== 4) {
      throw new HttpError(404, "not found");
    }
    const workspaceId = seg[2];
    const subaction = seg[3];
    if (subaction !== "invites" && subaction !== "members") {
      throw new HttpError(404, "not found");
    }
    const actor = authenticate(req.headers);
    const method = req.method.toUpperCase();

    if (subaction === "invites" && method === "POST") {
      // Inviting members requires Admin or Owner.
      const inviter = assertRole(workspaceId, actor.userId, "Admin");

      const body = (req.body ?? {}) as { email?: unknown; role?: unknown };
      const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
      if (!email) throw new HttpError(400, "email is required");
      const target = findUserByEmail(email);
      if (!target) throw new HttpError(404, "user not found");

      const requested = (body.role as Role | undefined) ?? "Member";
      if (!INVITABLE_ROLES.includes(requested)) {
        throw new HttpError(400, "role must be Admin, Member or Viewer");
      }
      // Owner may invite Admin; Admin may only invite Member/Viewer.
      if (inviter.role !== "Owner" && requested === "Admin") {
        throw new HttpError(403, "only the workspace owner can invite Admins");
      }
      if (getMembership(workspaceId, target.id)) {
        throw new HttpError(409, "user is already a member of this workspace");
      }

      const membership: WorkspaceMember = {
        id: newId(),
        workspaceId,
        userId: target.id,
        role: requested,
        createdAt: nowIso(),
      };
      db.insert("workspaceMembers", membership);
      recordAudit({
        workspaceId,
        actorId: actor.userId,
        action: "member.invited",
        targetId: target.id,
        meta: { role: requested },
      });
      return { status: 201, body: { membership } };
    }

    if (subaction === "members" && method === "GET") {
      // Any member may list the roster.
      assertRole(workspaceId, actor.userId, "Member");
      const members = listMembers(workspaceId).map((m) => ({ userId: m.userId, role: m.role, createdAt: m.createdAt }));
      return { status: 200, body: { members } };
    }

    throw new HttpError(404, "not found");
  });
}