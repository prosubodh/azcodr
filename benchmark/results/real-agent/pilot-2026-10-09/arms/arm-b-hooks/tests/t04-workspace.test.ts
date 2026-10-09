import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  register,
  login,
  handleWorkspaces,
  getMembership,
  listWorkspacesForUser,
  getWorkspaceById,
  pendingEvents,
  db,
} from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

async function signup(email: string): Promise<{ userId: string; token: string }> {
  const password = `pw-${email}`;
  await register({ method: "POST", path: "/api/auth/register", body: { email, password } });
  const res = await login({ method: "POST", path: "/api/auth/login", body: { email, password } });
  return { userId: (res.body as any).user.id as string, token: (res.body as any).accessToken as string };
}

function createWorkspaceReq(token: string, name: string) {
  return handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name }, headers: { authorization: `Bearer ${token}` } });
}

test("T04: creator becomes the workspace Owner with tenancy applied on creation", async () => {
  const alice = await signup("alice@corp.com");
  const res = await createWorkspaceReq(alice.token, "Acme");
  assert.equal(res.status, 201);

  const ws = (res.body as any).workspace as any;
  assert.equal(ws.name, "Acme");
  assert.equal(ws.role, "Owner");
  assert.equal(ws.plan, "free");

  const membership = getMembership(ws.id, alice.userId)!;
  assert.equal(membership.role, "Owner", "creator is the workspace owner");

  // Outbox event was persisted atomically with workspace creation
  const events = pendingEvents();
  assert.equal(events.length, 1);
  assert.equal(events[0].type, "workspace.created");
  assert.equal(events[0].aggregateId, ws.id);
});

test("T04: workspace queries are partitioned strictly by workspaceId (10,000-foot tenancy)", async () => {
  const alice = await signup("alice@corp.com");
  const bob = await signup("bob@corp.com");

  const aRes = await createWorkspaceReq(alice.token, "Acme");
  const aWs = (aRes.body as any).workspace as any;
  const bRes = await createWorkspaceReq(bob.token, "Globex");
  const bWs = (bRes.body as any).workspace as any;

  // Alice cannot read Bob's workspace — 404, no existence leak.
  const foreignRead = await handleWorkspaces({
    method: "GET",
    path: `/api/workspaces/${bWs.id}`,
    headers: { authorization: `Bearer ${alice.token}` },
  });
  assert.equal(foreignRead.status, 404);

  // Bob cannot read Alice's workspace either.
  const bobReadAlice = await handleWorkspaces({
    method: "GET",
    path: `/api/workspaces/${aWs.id}`,
    headers: { authorization: `Bearer ${bob.token}` },
  });
  assert.equal(bobReadAlice.status, 404);

  // Lists are partitioned: each user sees only their own workspace.
  const aliceList = await handleWorkspaces({ method: "GET", path: "/api/workspaces", headers: { authorization: `Bearer ${alice.token}` } });
  assert.deepEqual((aliceList.body as any).workspaces.map((w: any) => w.id), [aWs.id]);

  const bobList = await handleWorkspaces({ method: "GET", path: "/api/workspaces", headers: { authorization: `Bearer ${bob.token}` } });
  assert.deepEqual((bobList.body as any).workspaces.map((w: any) => w.id), [bWs.id]);

  // Owner can read their own workspace with their role attached.
  const ownRead = await handleWorkspaces({
    method: "GET",
    path: `/api/workspaces/${aWs.id}`,
    headers: { authorization: `Bearer ${alice.token}` },
  });
  assert.equal(ownRead.status, 200);
  assert.equal((ownRead.body as any).workspace.id, aWs.id);
  assert.equal((ownRead.body as any).workspace.role, "Owner");

  // Helper-level scoping matches the handler.
  assert.deepEqual(listWorkspacesForUser(alice.userId).map((w) => w.id), [aWs.id]);
  assert.equal(getWorkspaceById(bWs.id)?.id, bWs.id, "raw id lookup still works for the store itself");
});

test("T04: unauthenticated workspace access returns 401, invalid body 400", async () => {
  const unauth = await handleWorkspaces({ method: "GET", path: "/api/workspaces" });
  assert.equal(unauth.status, 401);

  const alice = await signup("alice@corp.com");
  const noName = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: {}, headers: { authorization: `Bearer ${alice.token}` } });
  assert.equal(noName.status, 400);
});