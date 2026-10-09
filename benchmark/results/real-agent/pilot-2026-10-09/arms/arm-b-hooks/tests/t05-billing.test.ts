import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  register,
  login,
  handleWorkspaces,
  handleBilling,
  checkFeature,
  setSubscriptionPlan,
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

async function createWs(token: string, name: string): Promise<string> {
  const res = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name }, headers: { authorization: `Bearer ${token}` } });
  assert.equal(res.status, 201);
  return (res.body as any).workspace.id as string;
}

function checkReq(token: string, workspaceId: string, feature: string) {
  return handleBilling({
    method: "POST",
    path: `/api/workspaces/${workspaceId}/feature-checks`,
    body: { feature },
    headers: { authorization: `Bearer ${token}` },
  });
}

test("T05: free tier allows free features and blocks pro features with 403", async () => {
  const owner = await signup("ceo@startup.io");
  const wsId = await createWs(owner.token, "StartupHQ");

  const freeOk = await checkReq(owner.token, wsId, "basic_analytics");
  assert.equal(freeOk.status, 200);
  assert.deepEqual(freeOk.body, {
    allowed: true,
    feature: "basic_analytics",
    plan: "free",
    status: "active",
  });

  const proBlocked = await checkReq(owner.token, wsId, "sso");
  assert.equal(proBlocked.status, 403);
  assert.match((proBlocked.body as any).error, /sso.*free plan/i);
});

test("T05: pro tier unlocks pro features per workspace", async () => {
  const owner = await signup("ceo@startup.io");
  const wsId = await createWs(owner.token, "StartupHQ");

  // Billing upgrade for THIS workspace only.
  setSubscriptionPlan(wsId, "pro");

  const nowOk = await checkReq(owner.token, wsId, "sso");
  assert.equal(nowOk.status, 200);
  assert.equal((nowOk.body as any).allowed, true);
  assert.equal((nowOk.body as any).plan, "pro");

  const core = checkFeature(wsId, "basic_analytics");
  assert.equal(core.allowed, true);
});

test("T05: gates are scoped per workspace — another free workspace stays restricted", async () => {
  const owner = await signup("ceo@startup.io");
  const wsA = await createWs(owner.token, "ProInc");
  const wsB = await createWs(owner.token, "FreeScoop");

  setSubscriptionPlan(wsA, "pro");

  assert.equal((await checkReq(owner.token, wsA, "custom_domains")).status, 200);
  assert.equal((await checkReq(owner.token, wsB, "custom_domains")).status, 403);
});

test("T05: unknown feature returns 400 and non-members cannot probe", async () => {
  const owner = await signup("ceo@startup.io");
  const intruder = await signup("mole@elsewhere.io");
  const wsId = await createWs(owner.token, "Vault");

  const unknown = await checkReq(owner.token, wsId, "time_travel");
  assert.equal(unknown.status, 400);

  const nonMember = await checkReq(intruder.token, wsId, "basic_analytics");
  assert.equal(nonMember.status, 404, "non-members get 404 (no existence leak)");
});