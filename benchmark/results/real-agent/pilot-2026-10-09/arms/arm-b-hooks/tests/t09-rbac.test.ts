import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  register,
  login,
  handleWorkspaces,
  handleRbac,
  getMembership,
  listAuditLog,
  db,
} from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

async function signup(email: string): Promise<{ userId: string; token: string; email: string }> {
  const password = `pw-${email}`;
  await register({ method: "POST", path: "/api/auth/register", body: { email, password } });
  const res = await login({ method: "POST", path: "/api/auth/login", body: { email, password } });
  return { userId: (res.body as any).user.id, token: (res.body as any).accessToken, email };
}

async function createWs(token: string, name: string): Promise<string> {
  const res = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name }, headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.status, 201);
  return (res.body as any).workspace.id as string;
}

function invite(token: string, workspaceId: string, email: string, role?: string) {
  return handleRbac({
    method: "POST",
    path: `/api/workspaces/${workspaceId}/invites`,
    body: { email, ...(role ? { role } : {}) },
    headers: { authorization: `Bearer ${token}` },
  });
}

function changeRole(token: string, workspaceId: string, targetUserId: string, role: string) {
  return handleWorkspaces({
    method: "PUT",
    path: `/api/workspaces/${workspaceId}/members/${targetUserId}`,
    body: { role },
    headers: { authorization: `Bearer ${token}` },
  });
}

test("T09: an Admin can invite members into the workspace", async () => {
  const owner = await signup("owner@rbac.io");
  const admin = await signup("admin@rbac.io");
  const newbie = await signup("newbie@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");

  // Owner appoints an Admin by inviting them as one.
  const appoint = await invite(owner.token, wsId, admin.email, "Admin");
  assert.equal(appoint.status, 201);
  assert.equal(getMembership(wsId, admin.userId)!.role, "Admin");

  // Admin invites a Member (default role).
  const res = await invite(admin.token, wsId, newbie.email);
  assert.equal(res.status, 201);
  const membership = (res.body as any).membership as any;
  assert.equal(membership.workspaceId, wsId);
  assert.equal(membership.userId, newbie.userId);
  assert.equal(membership.role, "Member");
  assert.equal(getMembership(wsId, newbie.userId)!.role, "Member");

  // The invite was audited.
  const auditActions = listAuditLog(wsId, { limit: 50 }).records.map((r) => r.action);
  assert.ok(auditActions.includes("member.invited"));
});

test("T09: a Viewer gets 403 when trying to invite", async () => {
  const owner = await signup("owner@rbac.io");
  const viewer = await signup("viewer@rbac.io");
  const victim = await signup("victim@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");

  await invite(owner.token, wsId, viewer.email, "Viewer");
  assert.equal(getMembership(wsId, viewer.userId)!.role, "Viewer");

  const res = await invite(viewer.token, wsId, victim.email);
  assert.equal(res.status, 403);
  assert.match((res.body as any).error, /Admin/i);
  assert.equal(getMembership(wsId, victim.userId), undefined, "no membership was created");
});

test("T09: a plain Member also gets 403 on invites", async () => {
  const owner = await signup("owner@rbac.io");
  const member = await signup("member@rbac.io");
  const ghost = await signup("ghost@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");
  await invite(owner.token, wsId, member.email, "Member");

  const res = await invite(member.token, wsId, ghost.email);
  assert.equal(res.status, 403);
});

test("T09: invite rules — Admin cannot invite Admins; the Owner role cannot be invited", async () => {
  const owner = await signup("owner@rbac.io");
  const admin = await signup("admin@rbac.io");
  const other = await signup("other@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");
  await invite(owner.token, wsId, admin.email, "Admin");

  const adminInvitesAdmin = await invite(admin.token, wsId, other.email, "Admin");
  assert.equal(adminInvitesAdmin.status, 403, "only the owner can invite Admins");

  const ownerInvitesOwner = await invite(owner.token, wsId, other.email, "Owner");
  assert.equal(ownerInvitesOwner.status, 400, "Owner is not an invitable role");

  const ownerInvitesAdmin = await invite(owner.token, wsId, other.email, "Admin");
  assert.equal(ownerInvitesAdmin.status, 201);
  assert.equal(getMembership(wsId, other.userId)!.role, "Admin");
});

test("T09: roster listing is available to members and 404 for outsiders", async () => {
  const owner = await signup("owner@rbac.io");
  const member = await signup("member@rbac.io");
  const outsider = await signup("outsider@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");
  await invite(owner.token, wsId, member.email, "Member");

  const listRes = await handleRbac({ method: "GET", path: `/api/workspaces/${wsId}/members`, headers: { authorization: `Bearer ${member.token}` } });
  assert.equal(listRes.status, 200);
  const roster = (listRes.body as any).members.map((m: any) => ({ userId: m.userId, role: m.role }));
  const withEmails = roster.map((m: any) => (m.userId === owner.userId ? "Owner" : m.userId === member.userId ? "Member" : m.role)).sort();
  assert.deepEqual(withEmails, ["Member", "Owner"]);

  const outside = await handleRbac({ method: "GET", path: `/api/workspaces/${wsId}/members`, headers: { authorization: `Bearer ${outsider.token}` } });
  assert.equal(outside.status, 404);
});

test("T09: role changes require Owner; only an existing member's role changes", async () => {
  const owner = await signup("owner@rbac.io");
  const member = await signup("member@rbac.io");
  const other = await signup("other@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");
  await invite(owner.token, wsId, member.email, "Member");

  // A non-owner cannot change roles.
  const forbidden = await changeRole(member.token, wsId, other.userId, "Viewer");
  assert.equal(forbidden.status, 403);

  // Changing a non-member's role is a 404 (no such member).
  const noSuchMember = await changeRole(owner.token, wsId, other.userId, "Viewer");
  assert.equal(noSuchMember.status, 404);

  // The owner can change an existing member's role.
  const ok = await changeRole(owner.token, wsId, member.userId, "Viewer");
  assert.equal(ok.status, 200);
  assert.equal(getMembership(wsId, member.userId)!.role, "Viewer");
});

test("T09: inviting an unknown email returns 404, duplicate invite 409", async () => {
  const owner = await signup("owner@rbac.io");
  const target = await signup("target@rbac.io");
  const wsId = await createWs(owner.token, "RBACCo");

  const unknown = await invite(owner.token, wsId, "nobody@nowhere.io");
  assert.equal(unknown.status, 404);

  const first = await invite(owner.token, wsId, target.email);
  assert.equal(first.status, 201);

  const second = await invite(owner.token, wsId, target.email);
  assert.equal(second.status, 409);
});