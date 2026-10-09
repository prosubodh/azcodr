/**
 * T07 – Payment webhook reconciliation (Stripe).
 *
 * `POST /api/payments/stripe-webhook` receives raw Stripe events. Signatures
 * are verified with HMAC-SHA256 over `t.<payload>` using the webhook secret
 * (node:crypto — no Stripe SDK). A paid invoice flips the workspace
 * subscription to `active`; a failed payment marks it `past_due`.
 *
 * The domain work (`applyInvoicePaid`) lives here and reaches persistence
 * through the billing module — it never calls the HTTP transport or touches
 * the raw store itself.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { headerValue } from "./crypto.ts";
import { setSubscriptionPlan, updateSubscriptionStatus } from "./billing.ts";
import { recordAudit } from "./audit.ts";
import { HttpError, pathSegments, respond, type HttpRequest, type HttpResponse } from "./types.ts";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_test_secret";
const TIMESTAMP_TOLERANCE_MS = 5 * 60 * 1000;

export interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: {
      customer?: string;
      subscription?: string;
      metadata?: Record<string, string>;
    };
  };
}

export function verifyStripeSignature(rawBody: string, signatureHeader: string | undefined): void {
  if (!signatureHeader) throw new HttpError(400, "missing stripe-signature header");

  // Stripe sends `t=...,v1=...,v0=...` (comma-separated `key=value` pairs).
  const entries = new Map<string, string>();
  for (const part of signatureHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    entries.set(part.slice(0, eq).trim(), part.slice(eq + 1).trim());
  }
  const t = entries.get("t");
  const v1 = entries.get("v1");
  if (!t || !v1) throw new HttpError(400, "malformed stripe-signature header");

  const timestamp = Number.parseInt(t, 10);
  if (Number.isNaN(timestamp) || Math.abs(Date.now() / 1000 - timestamp) > TIMESTAMP_TOLERANCE_MS / 1000) {
    throw new HttpError(400, "webhook timestamp out of tolerance");
  }

  const expected = Buffer.from(createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${rawBody}`).digest("hex"), "hex");
  const provided = Buffer.from(v1, "hex");
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new HttpError(400, "invalid stripe signature");
  }
}

export function parseStripeEvent(rawBody: string): StripeEvent {
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    throw new HttpError(400, "invalid webhook payload");
  }
  if (typeof event.type !== "string" || !event.data?.object || typeof event.data.object !== "object") {
    throw new HttpError(400, "malformed webhook event");
  }
  return event;
}

/**
 * Core reconciliation for `invoice.paid`: the workspace's subscription is set
 * to active (and its plan upgraded when the invoice metadata says so).
 */
export function applyInvoicePaid(event: StripeEvent): { workspaceId: string; status: "active"; plan: string } {
  const invoice = event.data.object;
  const workspaceId = invoice.metadata?.workspace_id ?? invoice.metadata?.workspaceId;
  if (!workspaceId) throw new HttpError(400, "invoice metadata is missing workspace_id");

  const plan = invoice.metadata?.plan;
  if (plan === "pro" || plan === "free") {
    setSubscriptionPlan(workspaceId, plan);
  }
  updateSubscriptionStatus(workspaceId, "active");
  recordAudit({
    workspaceId,
    actorId: "stripe",
    action: "subscription.updated",
    meta: { event: event.type, status: "active", plan: plan ?? "unchanged" },
  });
  return { workspaceId, status: "active", plan: plan ?? "unchanged" };
}

export async function handlePayment(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "payments" || seg[2] !== "stripe-webhook") {
      throw new HttpError(404, "not found");
    }
    if (req.method.toUpperCase() !== "POST") throw new HttpError(405, "method not allowed");

    const rawBody =
      req.rawBody ??
      (typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {}));
    verifyStripeSignature(rawBody, headerValue(req.headers, "stripe-signature"));
    const event = parseStripeEvent(rawBody);

    if (event.type === "invoice.paid") {
      const result = applyInvoicePaid(event);
      return { status: 200, body: { received: true, type: event.type, workspaceId: result.workspaceId } };
    }
    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const workspaceId = invoice.metadata?.workspace_id ?? invoice.metadata?.workspaceId;
      if (!workspaceId) throw new HttpError(400, "invoice metadata is missing workspace_id");
      updateSubscriptionStatus(workspaceId, "past_due");
      recordAudit({
        workspaceId,
        actorId: "stripe",
        action: "subscription.updated",
        meta: { event: event.type, status: "past_due" },
      });
      return { status: 200, body: { received: true, type: event.type, workspaceId } };
    }
    // Unknown events are acknowledged without side effects.
    return { status: 200, body: { received: true, type: event.type } };
  });
}

export function signStripePayload(payload: string, t = Math.floor(Date.now() / 1000)): { header: string; timestamp: number } {
  const v1 = createHmac("sha256", WEBHOOK_SECRET).update(`${t}.${payload}`).digest("hex");
  return { header: `t=${t},v1=${v1}`, timestamp: t };
}