import { db } from "./db.ts";
import type { BillingFeature, BillingTier } from "./config.ts";
import { BILLING_PLANS } from "./config.ts";
import { membersOf, roleOf } from "./tenant.ts";
import { writeAudit } from "./audit.ts";
import { publishOutboxEvent } from "./outbox.ts";
import { authenticate } from "./auth.ts";
import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail, ok } from "./types.ts";

// ---------------------------------------------------------------------------
// T05 - Workspace billing tier verification.
//
// Feature gates are enforced per workspace against the subscription tier of
// that workspace. billing.ts reads workspace/membership data from tenant.ts;
// tenant.ts intentionally never imports this module (a cycle would otherwise
// form when tenant scoping wants to consult subscription state).
// ---------------------------------------------------------------------------

export function tierOf(workspaceId: string): BillingTier {
  return db.subscriptions.get(workspaceId)?.tier ?? "free";
}

export function featureLimits(tier: BillingTier) {
  return BILLING_PLANS[tier];
}

/** Current usage for a feature (workspace-member based features). */
export function currentUsage(workspaceId: string, feature: BillingFeature): number {
  if (feature === "maxMembers") return membersOf(workspaceId).length;
  return feature === "apiKeys" ? 0 : 0;
}

export interface FeatureState {
  limit: number | boolean;
  current: number;
  allowed: boolean;
}

export function featureState(workspaceId: string, feature: BillingFeature): FeatureState | null {
  const workspace = db.workspaces.get(workspaceId);
  if (!workspace || !db.subscriptions.has(workspaceId)) return null;
  const tier = tierOf(workspaceId);
  const limit = featureLimits(tier)[feature];
  const current = currentUsage(workspaceId, feature);
  const allowed = typeof limit === "boolean" ? limit : current < limit;
  return { limit, current, allowed };
}

function workspaceIdFromPath(path: string): string | null {
  const match = /^\/api\/workspaces\/([^/?#]+)/.exec(path.split("?")[0]);
  return match ? match[1] : null;
}

/**
 * GET /api/workspaces/:workspaceId/features
 * Lists every feature gate for the caller's workspace (member-only).
 */
export function listFeatureStates(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const workspaceId = workspaceIdFromPath(req.path);
  if (!workspaceId || !roleOf(workspaceId, actorId)) {
    return fail(404, "workspace not found");
  }

  const features: Record<string, FeatureState> = {};
  for (const feature of Object.keys(BILLING_PLANS.free) as BillingFeature[]) {
    const state = featureState(workspaceId, feature);
    if (state) features[feature] = state;
  }

  return ok({ workspaceId, tier: tierOf(workspaceId), features });
}

/**
 * POST /api/workspaces/:workspaceId/billing/upgrade
 * Simulates a successful Stripe Checkout session; moves the workspace to pro.
 * (T07's invoice.paid webhook is the source of truth in the real flow.)
 */
export function upgradeSubscription(req: HttpRequest): HttpResponse {
  const actorId = authenticate(req);
  if (!actorId) return fail(401, "unauthorized");

  const workspaceId = workspaceIdFromPath(req.path);
  if (!workspaceId) return fail(404, "workspace not found");

  const membership = roleOf(workspaceId, actorId);
  if (!membership) return fail(404, "workspace not found");
  if (membership.role !== "Owner" && membership.role !== "Admin") {
    return fail(403, "only owners and admins can change the billing plan");
  }

  const existing = db.subscriptions.get(workspaceId);
  if (!existing) return fail(404, "no subscription on this workspace");

  db.transaction(() => {
    db.subscriptions.set(workspaceId, {
      ...existing,
      tier: "pro",
      status: "active",
      updatedAt: Date.now(),
    });
    writeAudit(workspaceId, actorId, "billing.upgraded", { from: existing.tier, to: "pro" });
    publishOutboxEvent("billing.upgraded", workspaceId, {
      from: existing.tier,
      to: "pro",
    });
  });

  return ok({
    workspaceId,
    tier: "pro",
    status: "active",
    message: "workspace upgraded to pro",
  });
}