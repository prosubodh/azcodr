import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createWorkspace, listWorkspaces, getWorkspace, membersOf } from "../src/tenant.ts";
import { registerAndLogin, req, expectStatus, resetDb, expectOk, bearer } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

test("T04: creator becomes the workspace owner and the workspace is persisted", () => {
  const alice = registerAndLogin("alice@example.com");
  const res = createWorkspace(
    req("POST", "/api/workspaces", { name: "Acme" }, bearer(alice.token)),
  );
  expectStatus(res, 201);

  const body = expectOk(res);
  const workspace = body.workspace as any;
  assert.ok(workspace.id);
  assert.equal(workspace.name, "Acme");
  assert.equal(workspace.ownerId, alice.id);
  assert.equal(workspace.myRole, "Owner");
  assert.equal(workspace.memberCount, 1);
  assert.equal(workspace.tier, "free");

  const members = membersOf(workspace.id);
  assert.equal(members.length, 1);
  assert.equal(members[0].userId, alice.id);
  assert.equal(members[0].role, "Owner");
});

test("T04: workspace queries are partitioned strictly by workspaceId (tenancy)", () => {
  const alice = registerAndLogin("alice@example.com");
  const bob = registerAndLogin("bob@example.com");

  const created = expectOk(
    createWorkspace(req("POST", "/api/workspaces", { name: "Alice Co" }, bearer(alice.token))),
  ).workspace as any;
  expectOk(
    createWorkspace(req("POST", "/api/workspaces", { name: "Bob Co" }, bearer(bob.token))),
  );

  // Alice sees only her own workspace.
  const aliceList = expectOk(
    listWorkspaces(req("GET", "/api/workspaces", undefined, bearer(alice.token))),
  ).workspaces as any[];
  assert.equal(aliceList.length, 1);
  assert.equal(aliceList[0].id, created.id);
  assert.equal(aliceList[0].name, "Alice Co");
  assert.equal(aliceList[0].myRole, "Owner");

  // Bob sees only his own workspace.
  const bobList = expectOk(
    listWorkspaces(req("GET", "/api/workspaces", undefined, bearer(bob.token))),
  ).workspaces as any[];
  assert.equal(bobList.length, 1);
  assert.equal(bobList[0].name, "Bob Co");

  // Alice cannot read Bob's workspace: 404, no existence leak.
  const foreign = getWorkspace(
    req("GET", `/api/workspaces/${bobList[0].id}`, undefined, bearer(alice.token)),
  );
  expectStatus(foreign, 404);

  // Neither can see memberships of the other tenant.
  assert.equal(membersOf(bobList[0].id).every((m) => m.userId === bob.id), true);
});

test("T04: authentication guards workspace endpoints", () => {
  const noToken = createWorkspace(req("POST", "/api/workspaces", { name: "X" }));
  expectStatus(noToken, 401);

  const noTokenList = listWorkspaces(req("GET", "/api/workspaces"));
  expectStatus(noTokenList, 401);
});