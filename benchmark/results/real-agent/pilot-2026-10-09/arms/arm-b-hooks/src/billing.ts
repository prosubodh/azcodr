/**
 * T05 – Workspace billing tier verification.
 *
 * Subscription feature gates are enforced per workspace against its plan
 * (`free` vs `pro`). This module deliberately does NOT import tenant.ts: it
 * reads/writes its own `subscriptions` store keyed by workspaceId, so there is
 * no import cycle between the billing and workspace modules.
 */
import { db, newId, nowIso } from "./db.ts";
import { authenticate } from "./crypto.ts";
import { HttpError, pathSegments, respond, type HttpRequest, type HttpResponse } from "./types.ts";
import type { Plan } from "./tenant.ts";

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "incomplete"
  | "canceled";

export interface Subscription {
  id: string;
  workspaceId: string;
  plan: Plan;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  currentPeriodEnd?: string;
  createdAt: string;
  updatedAt: string;
}

const FREE_FEATURES = new Set(["basic_analytics", "member_roles", "t10_health"]);
const PRO_FEATURES = new Set([
  ...FREE_FEATURES,
  "unlimited_invites",
  "custom_domains",
  "priority_support",
  "audit_export",
  "sso",
]);

export function getAllFeatures(): Set<string> {
  return new Set([...FREE_FEATURES, ...PRO_FEATURES]);
}

export function getSubscription(workspaceId: string): Subscription {
  const existing = db.findOne<Subscription>("subscriptions", (s) => s.workspaceId === workspaceId);
  if (existing) return existing;
  const created: Subscription = {
    id: newId(),
    workspaceId,
    plan: "free",
    status: "active",
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.insert("subscriptions", created);
  return created;
}

export function setSubscriptionPlan(workspaceId: string, plan: Plan): Subscription {
  const sub = getSubscription(workspaceId);
  return db.update<Subscription>("subscriptions", sub.id, { plan, updatedAt: nowIso() })!;
}

export function updateSubscriptionStatus(workspaceId: string, status: SubscriptionStatus): Subscription {
  const sub = getSubscription(workspaceId);
  return db.update<Subscription>("subscriptions", sub.id, { status, updatedAt: nowIso() })!;
}

export interface FeatureCheckResult {
  allowed: boolean;
  feature: string;
  plan: Plan;
  status: SubscriptionStatus;
}

/** Core gate: is `feature` usable by `workspaceId` right now? */
export function checkFeature(workspaceId: string, feature: string): FeatureCheckResult {
  const sub = getSubscription(workspaceId);
  const paid = sub.status === "active" || sub.status === "trialing";
  const tierFeat = sub.plan === "pro" ? PRO_FEATURES : FREE_FEATURES;
  return { allowed: paid && tierFeat.has(feature), feature, plan: sub.plan, status: sub.status };
}

export function enforceFeatureGate(workspaceId: string, feature: string): FeatureCheckResult {
  if (!getAllFeatures().has(feature)) throw new HttpError(400, `unknown feature '${feature}'`);
  const result = checkFeature(workspaceId, feature);
  if (!result.allowed) {
    throw new HttpError(403, `feature '${feature}' is not available on the ${result.plan} plan`);
  }
  return result;
}

export async function handleBilling(req: HttpRequest): Promise<HttpResponse> {
  return respond(async () => {
    const seg = pathSegments(req.path);
    if (seg[0] !== "api" || seg[1] !== "workspaces" || seg[3] !== "feature-checks" || seg.length !== 4) {
      throw new HttpError(404, "not found");
    }
    if (req.method.toUpperCase() !== "POST") throw new HttpError(405, "method not allowed");

    const actor = authenticate(req.headers);
    const workspaceId = seg[2];

    // Tenancy: only members of the workspace may probe its gates.
    const membership = db.findOne("workspaceMembers", (m: any) => m.workspaceId === workspaceId && m.userId === actor.userId);
    if (!membership) throw new HttpError(404, "workspace not found");

    const body = (req.body ?? {}) as { feature?: unknown };
    const feature = typeof body.feature === "string" ? body.feature : "";
    if (!feature) throw new HttpError(400, "feature is required");

    const result = enforceFeatureGate(workspaceId, feature);
    return { status: 200, body: result };
  });
}