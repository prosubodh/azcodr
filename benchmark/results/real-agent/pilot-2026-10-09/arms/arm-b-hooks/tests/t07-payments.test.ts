import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import {
  register,
  login,
  handleWorkspaces,
  handlePayment,
  signStripePayload,
  getSubscription,
  updateSubscriptionStatus,
  db,
} from "../src/index.ts";

beforeEach(() => {
  db.reset();
});

async function signup(email: string): Promise<{ token: string }> {
  const password = `pw-${email}`;
  await register({ method: "POST", path: "/api/auth/register", body: { email, password } });
  const res = await login({ method: "POST", path: "/api/auth/login", body: { email, password } });
  return { token: (res.body as any).accessToken };
}

async function createWs(token: string, name: string): Promise<string> {
  const res = await handleWorkspaces({ method: "POST", path: "/api/workspaces", body: { name }, headers: { authorization: `Bearer ${token}` } });
  const wsId = (res.body as any).workspace.id as string;
  // Simulate the subscription drifting out of active, e.g. after a card decline.
  updateSubscriptionStatus(wsId, "past_due");
  return wsId;
}

function invoicePaidEvent(workspaceId: string, opts: { plan?: string } = {}) {
  return JSON.stringify({
    id: "evt_inv_paid_1",
    type: "invoice.paid",
    data: {
      object: {
        customer: "cus_123",
        subscription: "sub_123",
        metadata: { workspace_id: workspaceId, ...(opts.plan ? { plan: opts.plan } : {}) },
      },
    },
  });
}

test("T07: a valid invoice.paid event reconciles the subscription to active", async () => {
  const owner = await signup("ceo@payments.io");
  const wsId = await createWs(owner.token, "PayCo");
  assert.equal(getSubscription(wsId).status, "past_due", "precondition: drifted subscription");

  const payload = invoicePaidEvent(wsId);
  const { header } = signStripePayload(payload);

  const res = await handlePayment({
    method: "POST",
    path: "/api/payments/stripe-webhook",
    rawBody: payload,
    body: JSON.parse(payload),
    headers: { "stripe-signature": header },
  });

  assert.equal(res.status, 200);
  assert.equal((res.body as any).received, true);
  assert.equal((res.body as any).type, "invoice.paid");
  assert.equal(getSubscription(wsId).status, "active", "subscription flipped to active");
});

test("T07: invoice.paid with a pro plan metadata upgrades the workspace tier", async () => {
  const owner = await signup("ceo@payments.io");
  const wsId = await createWs(owner.token, "PayCo");

  const payload = invoicePaidEvent(wsId, { plan: "pro" });
  const { header } = signStripePayload(payload);
  const res = await handlePayment({
    method: "POST",
    path: "/api/payments/stripe-webhook",
    rawBody: payload,
    body: JSON.parse(payload),
    headers: { "stripe-signature": header },
  });

  assert.equal(res.status, 200);
  assert.equal(getSubscription(wsId).plan, "pro");
});

test("T07: an invalid signature is rejected with 400 and changes nothing", async () => {
  const owner = await signup("ceo@payments.io");
  const wsId = await createWs(owner.token, "PayCo");

  const payload = invoicePaidEvent(wsId);
  const tampered = payload.replace("evt_inv_paid_1", "evt_inv_paid_2");
  const good = signStripePayload(tampered); // signature is correct for a *different* body

  const res = await handlePayment({
    method: "POST",
    path: "/api/payments/stripe-webhook",
    rawBody: payload,
    body: JSON.parse(payload),
    headers: { "stripe-signature": good.header },
  });

  assert.equal(res.status, 400);
  assert.match((res.body as any).error, /signature/i);
  assert.equal(getSubscription(wsId).status, "past_due", "no state change on invalid signature");
});

test("T07: a missing signature header is rejected with 400", async () => {
  const owner = await signup("ceo@payments.io");
  const wsId = await createWs(owner.token, "PayCo");

  const payload = invoicePaidEvent(wsId);
  const res = await handlePayment({ method: "POST", path: "/api/payments/stripe-webhook", rawBody: payload, body: JSON.parse(payload) });
  assert.equal(res.status, 400);
  assert.equal(getSubscription(wsId).status, "past_due");
});

test("T07: invoice.payment_failed marks the subscription past_due", async () => {
  const owner = await signup("ceo@payments.io");
  const wsId = await createWs(owner.token, "PayCo");
  updateSubscriptionStatus(wsId, "active"); // restore before simulating a failure

  const payload = JSON.stringify({
    id: "evt_inv_failed_1",
    type: "invoice.payment_failed",
    data: { object: { customer: "cus_123", subscription: "sub_123", metadata: { workspace_id: wsId } } },
  });
  const { header } = signStripePayload(payload);
  const res = await handlePayment({
    method: "POST",
    path: "/api/payments/stripe-webhook",
    rawBody: payload,
    body: JSON.parse(payload),
    headers: { "stripe-signature": header },
  });

  assert.equal(res.status, 200);
  assert.equal(getSubscription(wsId).status, "past_due");
});