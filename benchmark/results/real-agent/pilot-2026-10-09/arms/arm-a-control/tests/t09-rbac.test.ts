import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { inviteMember, listMembers, removeMember } from "../src/rbac.ts";
import { db } from "../src/db.ts";
import { pendingCount } from "../src/outbox.ts";
import {
  userWithWorkspace,
  registerAndLogin,
  req,
  expectStatus,
  resetDb,
  expectOk,
  bearer,
} from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

function inviteAs(token: string, workspaceId: string, email: string, role = "Member") {
  return inviteMember(
    req("POST", `/api/workspaces/${workspaceId}/members`, { email, role }, bearer(token)),
  );
}

test("T09: an Admin can invite members (acceptance)", () => {
  const { user: owner, workspaceId } = userWithWorkspace("rbc-owner@example.com");
  const admin = registerAndLogin("admin@example.com");
  const invitee = registerAndLogin("invitee@example.com");

  expectStatus(inviteAs(owner.token, workspaceId, admin.email, "Admin"), 201);

  const res = inviteAs(admin.token, workspaceId, invitee.email, "Member");
  expectStatus(res, 201);
  const membership = expectOk(res).membership as any;
  assert.equal(membership.email, invitee.email);
  assert.equal(membership.role, "Member");

  // The invite was written atomically with audit + outbox side effects.
  const row = db.memberships.get(membership.id);
  assert.equal(row?.workspaceId, workspaceId);
  assert.ok([...db.audits.values()].some((a) => a.action === "member.invited"));
  assert.ok(pendingCount() >= 1);
});

test("T09: a Viewer gets 403 when trying to invite (acceptance)", () => {
  const { user: owner, workspaceId } = userWithWorkspace("rbc-owner2@example.com");
  const viewer = registerAndLogin("viewer@example.com");
  expectStatus(inviteAs(owner.token, workspaceId, viewer.email, "Viewer"), 201);

  const res = inviteAs(viewer.token, workspaceId, "someone@example.com", "Member");
  expectStatus(res, 403);
  assert.equal((res.body as any).error, "insufficient permissions to invite members");
});

test("T09: members of every level are blocked from managing except Owner/Admin", () => {
  const { user: owner, workspaceId } = userWithWorkspace("rbc-owner3@example.com");
  const member = registerAndLogin("member@example.com");
  expectStatus(inviteAs(owner.token, workspaceId, member.email, "Member"), 201);

  const res = inviteAs(member.token, workspaceId, "someone-else@example.com", "Member");
  expectStatus(res, 403);

  // A total outsider is treated as 404 (no existence leak).
  const outsider = registerAndLogin("outsider@example.com");
  const outsiderRes = inviteAs(outsider.token, workspaceId, "x@example.com", "Member");
  expectStatus(outsiderRes, 404);
});

test("T09: invite validation - unknown email 404, duplicates 409, bad role 400", () => {
  const { user: owner, workspaceId } = userWithWorkspace("rbc-owner4@example.com");
  const alice = registerAndLogin("alice-rbc@example.com");

  expectStatus(inviteAs(owner.token, workspaceId, "missing@example.com"), 404);
  expectStatus(inviteAs(owner.token, workspaceId, alice.email, "Viewer"), 201);
  expectStatus(inviteAs(owner.token, workspaceId, alice.email, "Member"), 409);
  const badRole = inviteAs(owner.token, workspaceId, "nobody@example.com", "SuperAdmin");
  expectStatus(badRole, 400);
});

test("T09: roster is visible to all members, including viewers", () => {
  const { user: owner, workspaceId } = userWithWorkspace("rbc-owner5@example.com");
  const viewer = registerAndLogin("viewer-rbc@example.com");
  expectStatus(inviteAs(owner.token, workspaceId, viewer.email, "Viewer"), 201);

  const res = listMembers(
    req("GET", `/api/workspaces/${workspaceId}/members`, undefined, bearer(viewer.token)),
  );
  expectStatus(res, 200);
  const members = expectOk(res).members as Array<{ email: string; role: string }>;
  assert.equal(members.length, 2);
  assert.deepEqual(new Set(members.map((m) => m.role)), new Set(["Owner", "Viewer"]));

  // The viewer's roster is still scoped to this tenant only.
  const other = registerAndLogin("other@example.com");
  expectStatus(
    listMembers(req("GET", `/api/workspaces/${workspaceId}/members`, undefined, bearer(other.token))),
    404,
  );
});

test("T09: removeMember is manager-only and protects the last owner", () => {
  const { user: owner, workspaceId } = userWithWorkspace("rbc-owner6@example.com");
  const admin = registerAndLogin("admin6@example.com");
  const member = registerAndLogin("member6@example.com");
  const viewer = registerAndLogin("viewer6@example.com");

  for (const [email, role] of [
    [admin.email, "Admin"],
    [member.email, "Member"],
    [viewer.email, "Viewer"],
  ] as const) {
    expectStatus(inviteAs(owner.token, workspaceId, email, role), 201);
  }

  // Viewer cannot remove anyone.
  expectStatus(
    removeMember(
      req("DELETE", `/api/workspaces/${workspaceId}/members/${member.id}`, undefined, bearer(viewer.token)),
    ),
    403,
  );

  // Admin can remove the plain Member.
  expectStatus(
    removeMember(
      req("DELETE", `/api/workspaces/${workspaceId}/members/${member.id}`, undefined, bearer(admin.token)),
    ),
    200,
  );

  // The owner cannot be removed while they are the only owner.
  const soloOwner = userWithWorkspace("solo-owner@example.com");
  expectStatus(
    removeMember(
      req("DELETE", `/api/workspaces/${soloOwner.workspaceId}/members/${soloOwner.user.id}`, undefined, bearer(soloOwner.user.token)),
    ),
    400,
  );
});