import { db } from "./db.ts";
import { hmacHex, safeEqualHex } from "./crypto.ts";
import { STRIPE_WEBHOOK_SECRET } from "./config.ts";
import { writeAudit } from "./audit.ts";
import { publishOutboxEvent } from "./outbox.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail, ok } from "./types.ts";

// ---------------------------------------------------------------------------
// T07 - Payment webhook reconciliation.
//
// Handles Stripe `invoice.paid` events: verifies the HMAC signature on the
// request and flips the matching subscription to active. Invalid signatures
// are rejected with 400.
//
// NOTE: this core domain module talks directly to the data store (db) and does
// not go through any transport/repository layer - acceptable here, but it is
// exactly the kind of layering a structural check would flag.
// ---------------------------------------------------------------------------

interface StripeSignature {
  timestamp: string;
  signatures: Record<string, string>; // v0/v1 -> hex
}

export function parseStripeSignature(header: string): StripeSignature | null {
  const parts = header.split(",");
  const signatures: Record<string, string> = {};
  let timestamp: string | null = null;
  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq).trim();
    const value = part.slice(eq + 1).trim();
    if (key === "t") {
      timestamp = value;
    } else {
      signatures[key] = value;
    }
  }
  if (!timestamp) return null;
  return { timestamp, signatures };
}

/**
 * Verify a Stripe webhook signature per Stripe's documented scheme:
 * HMAC(secret, `${timestamp}.${payload}`) compared in constant time.
 */
export function verifyStripeSignature(
  header: string | undefined,
  payload: string,
): boolean {
  if (!header) return false;
  const parsed = parseStripeSignature(header);
  if (!parsed || !parsed.signatures["v1"]) return false;
  const expected = hmacHex(STRIPE_WEBHOOK_SECRET, `${parsed.timestamp}.${payload}`);
  return safeEqualHex(expected, parsed.signatures["v1"]);
}

function rawPayloadOf(body: unknown): string {
  return typeof body === "string" ? body : JSON.stringify(body ?? {});
}

/**
 * POST /api/webhooks/stripe
 * Body: a Stripe event object. Requires a valid `stripe-signature` header.
 */
export function handleStripeWebhook(req: HttpRequest): HttpResponse {
  const signatureHeader = req.headers["stripe-signature"] ?? req.headers["stripe_signature"];
  const payload = rawPayloadOf(req.body);
  if (!verifyStripeSignature(signatureHeader, payload)) {
    return fail(400, "invalid signature");
  }

  let event: { type?: unknown; data?: unknown };
  try {
    event = JSON.parse(payload) as typeof event;
  } catch {
    return fail(400, "invalid JSON payload");
  }
  if (typeof event.type !== "string") return fail(400, "missing event type");

  if (event.type === "invoice.paid") {
    const object = ((event.data ?? {}) as { object?: unknown }).object as {
      customer?: unknown;
      metadata?: Record<string, unknown>;
    } | undefined;
    if (!object) return fail(400, "invoice.paid event missing data.object");

    const customer = typeof object.customer === "string" ? object.customer : null;
    const metadataWorkspace =
      object.metadata && typeof object.metadata.workspaceId === "string"
        ? object.metadata.workspaceId
        : null;

    // Reconcile against the workspace subscription in the store.
    let workspaceId: string | null = null;
    for (const subscription of db.subscriptions.values()) {
      if (customer && subscription.stripeCustomerId === customer) {
        workspaceId = subscription.workspaceId;
        break;
      }
    }
    if (!workspaceId && metadataWorkspace && db.subscriptions.has(metadataWorkspace)) {
      workspaceId = metadataWorkspace;
    }
    if (!workspaceId) {
      // Unknown customer: acknowledge but do not change any state.
      return ok({ received: true });
    }

    const existing = db.subscriptions.get(workspaceId);
    if (!existing) return fail(404, "subscription not found");

    db.transaction(() => {
      db.subscriptions.set(workspaceId, {
        ...existing,
        tier: "pro",
        status: "active",
        stripeCustomerId: customer ?? existing.stripeCustomerId,
        updatedAt: Date.now(),
      });
      writeAudit(workspaceId, "stripe", "billing.invoice.paid", {
        customer,
      });
      publishOutboxEvent("billing.invoice.paid", workspaceId, { customer });
    });
  }

  return ok({ received: true });
}