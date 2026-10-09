import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { inviteMember } from "../src/rbac.ts";
import { listFeatureStates, upgradeSubscription } from "../src/billing.ts";
import { userWithWorkspace, registerAndLogin, req, expectStatus, resetDb, expectOk, bearer } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

function inviteAs(token: string, workspaceId: string, email: string, role = "Member") {
  return inviteMember(
    req("POST", `/api/workspaces/${workspaceId}/members`, { email, role }, bearer(token)),
  );
}

/** Register a user first (invites only work for existing accounts). */
function user(email: string) {
  return registerAndLogin(email);
}

test("T05: free tier caps workspace membership and the gate stops at the limit", () => {
  const { user: owner, workspaceId } = userWithWorkspace("owner@example.com");
  const admin = user("ceo@example.com");
  expectOk(inviteAs(owner.token, workspaceId, admin.email, "Admin"));

  const features = expectOk(
    listFeatureStates(
      req("GET", `/api/workspaces/${workspaceId}/features`, undefined, bearer(owner.token)),
    ),
  );
  assert.equal(features.tier, "free");
  assert.deepEqual(
    { limit: (features.features as any).maxMembers.limit, current: (features.features as any).maxMembers.current },
    { limit: 5, current: 2 },
  );
  // Non-plan features are locked on free.
  assert.equal((features.features as any).sso.allowed, false);

  // Free tier allows maxMembers == 5 total (owner + admin + 3 more invites).
  const members: string[] = [];
  for (let i = 1; i <= 3; i += 1) {
    const m = user(`member${i}@example.com`);
    members.push(m.email);
    expectStatus(inviteAs(owner.token, workspaceId, m.email), 201);
  }

  // One more would exceed the cap: 5 current members + 1 invite = 6 > 5.
  const overflowUser = user("overflow@example.com");
  const blocked = inviteAs(owner.token, workspaceId, overflowUser.email);
  expectStatus(blocked, 402);
  const body = blocked.body as any;
  assert.equal(body.feature, "maxMembers");
  assert.equal(body.limit, 5);
  assert.equal(body.current, 5);
  assert.ok(members.length >= 3);
});

test("T05: upgrading to pro unlocks member capacity and paid features", () => {
  const { user: owner, workspaceId } = userWithWorkspace("pro-owner@example.com");

  const upgraded = upgradeSubscription(
    req("POST", `/api/workspaces/${workspaceId}/billing/upgrade`, {}, bearer(owner.token)),
  );
  expectStatus(upgraded, 200);
  assert.equal((upgraded.body as any).tier, "pro");

  const features = expectOk(
    listFeatureStates(
      req("GET", `/api/workspaces/${workspaceId}/features`, undefined, bearer(owner.token)),
    ),
  );
  assert.equal(features.tier, "pro");
  assert.equal((features.features as any).maxMembers.limit, 100);
  assert.equal((features.features as any).sso.allowed, true);

  // Now invites beyond the free cap are allowed.
  for (let i = 1; i <= 6; i += 1) {
    const m = user(`pro-member${i}@example.com`);
    expectStatus(inviteAs(owner.token, workspaceId, m.email), 201);
  }
});

test("T05: non-managers cannot change the billing plan", () => {
  const { user: owner, workspaceId } = userWithWorkspace("owner-b@example.com");
  const viewer = registerAndLogin("viewer-b@example.com");
  expectOk(inviteAs(owner.token, workspaceId, viewer.email, "Viewer"));

  const denied = upgradeSubscription(
    req("POST", `/api/workspaces/${workspaceId}/billing/upgrade`, {}, bearer(viewer.token)),
  );
  expectStatus(denied, 403);
});