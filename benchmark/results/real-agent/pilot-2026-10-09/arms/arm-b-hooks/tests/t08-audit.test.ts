import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  register,
  login,
  handleWorkspaces,
  handleAudit,
  recordAudit,
  listAuditLog,
  db,
} from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

async function signup(email: string): Promise<{ userId: string; token: string }> {
  const password = `pw-${email}`;
  await register({ method: "POST", path: "/api/auth/register", body: { email, password } });
  const res = await login({ method: "POST", path: "/api/auth/login", body: { email, password } });
  return { userId: (res.body as any).user.id, token: (res.body as any).accessToken };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

test("T08: audit log returns records ordered by timestamp descending", async () => {
  const owner = await signup("alice@audit.io");
  const wsRes = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name: "AuditCo" }, headers: { authorization: `Bearer ${owner.token}` } });
  const wsId = (wsRes.body as any).workspace.id as string;

  for (const action of ["a.first", "b.second", "c.third"]) {
    recordAudit({ workspaceId: wsId, actorId: owner.userId, action });
    await sleep(5); // distinct createdAt timestamps
  }

  const page = listAuditLog(wsId, { limit: 10 });
  const actions = page.records.map((r) => r.action);
  // workspace creation itself records a workspace.created audit entry (oldest)
  assert.deepEqual(actions, ["c.third", "b.second", "a.first", "workspace.created"], "newest first");
  for (let i = 1; i < page.records.length; i++) {
    assert.ok(page.records[i - 1].createdAt >= page.records[i].createdAt, "non-increasing timestamps");
  }
});

test("T08: paging with a cursor returns records strictly after the cursor page", async () => {
  const owner = await signup("alice@audit.io");
  const wsRes = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name: "AuditCo" }, headers: { authorization: `Bearer ${owner.token}` } });
  const wsId = (wsRes.body as any).workspace.id as string;

  const recorded: string[] = [];
  for (let i = 0; i < 5; i++) {
    const entry = recordAudit({ workspaceId: wsId, actorId: owner.userId, action: `event-${i}` });
    recorded.push(entry.id);
    await sleep(5);
  }
  // Full newest-first order (includes the workspace.created entry as the oldest row).
  const fullOrder = listAuditLog(wsId, { limit: 10 }).records.map((r) => r.id);

  const page1 = listAuditLog(wsId, { limit: 2 });
  assert.equal(page1.records.length, 2);
  assert.ok(page1.nextCursor, "page 1 has a nextCursor");

  const page2 = listAuditLog(wsId, { limit: 2, cursor: page1.nextCursor! });
  assert.equal(page2.records.length, 2);

  const page3 = listAuditLog(wsId, { limit: 10, cursor: page2.nextCursor! });
  assert.equal(page3.records.length, 2, "remaining rows (5 events + workspace.created) minus 4 already paged");
  assert.equal(page3.nextCursor, null, "final page has no cursor");

  const ids = [...page1.records, ...page2.records, ...page3.records].map((r) => r.id);
  assert.deepEqual(ids, fullOrder, "pages concatenate to the full newest-first list, no overlap");

  // Strictly-after: every record on a later page has a strictly smaller seq
  // (i.e. is strictly older) than the cursor of the earlier page.
  const lastSeqPage1 = page1.records[page1.records.length - 1].seq;
  for (const r of page2.records) {
    assert.ok(r.seq < lastSeqPage1, "page 2 records are strictly after the page 1 cursor");
  }
});

test("T08: an invalid cursor returns 400", () => {
  const owner = { userId: "u1", token: "" };
  void owner;
  assert.throws(
    () => listAuditLog("ws-1", { cursor: "!!!not-base64-json!!!" }),
    (err: any) => err.status === 400,
  );
});

test("T08: handler enforces authentication and membership before listing", async () => {
  const owner = await signup("alice@audit.io");
  const intruder = await signup("mole@elsewhere.io");
  const wsRes = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name: "AuditCo" }, headers: { authorization: `Bearer ${owner.token}` } });
  const wsId = (wsRes.body as any).workspace.id as string;
  recordAudit({ workspaceId: wsId, actorId: owner.userId, action: "workspace.created" });

  const unauth = await handleAudit({ method: "GET", path: `/api/audit?workspaceId=${wsId}` });
  assert.equal(unauth.status, 401);

  const nonMember = await handleAudit({ method: "GET", path: `/api/audit?workspaceId=${wsId}`, headers: { authorization: `Bearer ${intruder.token}` } });
  assert.equal(nonMember.status, 404);

  const ok = await handleAudit({ method: "GET", path: `/api/audit?workspaceId=${wsId}&limit=1`, headers: { authorization: `Bearer ${owner.token}` } });
  assert.equal(ok.status, 200);
  const body = ok.body as any;
  assert.ok(Array.isArray(body.records));
  assert.equal(body.records.length, 1);
  assert.ok(typeof body.nextCursor === "string");
});