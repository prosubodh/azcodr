import { beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { db } from "../src/db.ts";
import { handleStripeWebhook } from "../src/payments.ts";
import { STRIPE_WEBHOOK_SECRET } from "../src/config.ts";
import { userWithWorkspace, req, expectStatus, resetDb, expectOk } from "./helpers.ts";

beforeEach(() => {
  resetDb();
});

function stripeHeader(payload: string, overrides?: { tampered?: boolean }) {
  const t = Math.floor(Date.now() / 1000);
  const v1 = createHmac("sha256", STRIPE_WEBHOOK_SECRET)
    .update(`${t}.${payload}`)
    .digest("hex");
  return `t=${t},v1=${overrides?.tampered ? v1.slice(0, -2) + "00" : v1}`;
}

type SignatureMode = "valid" | "missing" | "tampered";

function webhook(event: object, mode: SignatureMode = "valid") {
  const payload = JSON.stringify(event);
  const header =
    mode === "missing"
      ? undefined
      : stripeHeader(payload, mode === "tampered" ? { tampered: true } : undefined);
  return handleStripeWebhook(
    req("POST", "/api/webhooks/stripe", payload, {
      "stripe-signature": header ?? "",
    }),
  );
}

test("T07: invoice.paid updates the workspace subscription to active", () => {
  const { user, workspaceId } = userWithWorkspace("webhook-owner@example.com");

  expectOk(webhook({
    id: "evt_1",
    type: "invoice.paid",
    data: { object: { customer: "cus_123", metadata: { workspaceId } } },
  }));

  const subscription = db.subscriptions.get(workspaceId);
  assert.ok(subscription);
  assert.equal(subscription.status, "active");
  assert.equal(subscription.tier, "pro");
  assert.equal(subscription.stripeCustomerId, "cus_123");

  // The reconciliation is itself audited + queued atomically.
  assert.ok([...db.audits.values()].some((a) => a.action === "billing.invoice.paid"));
  assert.ok([...db.outbox.values()].some((e) => e.type === "billing.invoice.paid"));
  assert.ok(user.id);
});

test("T07: subscriptions are reconciled by stripe customer id", () => {
  const { workspaceId } = userWithWorkspace("webhook-owner2@example.com");
  const sub = db.subscriptions.get(workspaceId);
  db.subscriptions.set(workspaceId, { ...sub!, stripeCustomerId: "cus_customer-link" });

  expectOk(webhook({
    id: "evt_2",
    type: "invoice.paid",
    data: { object: { customer: "cus_customer-link" } },
  }));

  assert.equal(db.subscriptions.get(workspaceId)?.status, "active");
});

test("T07: invalid signatures are rejected with 400 and change nothing", () => {
  const { workspaceId } = userWithWorkspace("webhook-owner3@example.com");
  const before = db.subscriptions.get(workspaceId);

  const event = {
    id: "evt_3",
    type: "invoice.paid",
    data: { object: { customer: "cus_999", metadata: { workspaceId } } },
  };

  // Missing header.
  expectStatus(webhook(event, "missing"), 400);

  // Tampered signature.
  expectStatus(webhook(event, "tampered"), 400);

  assert.deepEqual(db.subscriptions.get(workspaceId), before);
  assert.equal(db.users.size, 1);
});

test("T07: irrelevant valid events are acknowledged without side effects", () => {
  const { workspaceId } = userWithWorkspace("webhook-owner4@example.com");
  const before = db.subscriptions.get(workspaceId);

  expectOk(webhook({
    id: "evt_4",
    type: "invoice.created",
    data: { object: { amount: 2000 } },
  }));

  assert.deepEqual(db.subscriptions.get(workspaceId), before);
});

test("T07: unknown customers are acknowledged but not applied", () => {
  const res = webhook({
    id: "evt_5",
    type: "invoice.paid",
    data: { object: { customer: "cus_unknown" } },
  });
  const body = res.body as { received: boolean };
  assert.equal(res.status, 200);
  assert.equal(body.received, true);
  assert.equal(db.subscriptions.size, 0);
});