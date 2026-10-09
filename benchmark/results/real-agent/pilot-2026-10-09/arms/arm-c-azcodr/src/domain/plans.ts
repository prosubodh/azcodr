import type { WorkspaceId } from './ids.ts';

/**
 * Shared billing contract (docs/rules/clean_code.md: extract shared types to
 * prevent billing <-> tenancy import cycles). Both billing and tenancy
 * depend on this module; it depends on nothing but ids.
 */
export type PlanTier = 'free' | 'pro';

export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled';

export type FeatureId = 'advanced-audit' | 'unlimited-members';

const ALL_FEATURES: readonly FeatureId[] = ['advanced-audit', 'unlimited-members'];

/** Subscription feature gates per tier (free vs pro). */
export const FEATURE_GATES: Readonly<Record<PlanTier, ReadonlySet<FeatureId>>> = {
  free: new Set<FeatureId>(),
  pro: new Set<FeatureId>(ALL_FEATURES)
};

export function planAllows(tier: PlanTier, feature: FeatureId): boolean {
  return FEATURE_GATES[tier].has(feature);
}

export function isFeatureId(value: string): value is FeatureId {
  return (ALL_FEATURES as readonly string[]).includes(value);
}

/** Subscription aggregate: the tenant's billing entitlement record. */
export interface Subscription {
  readonly id: string;
  readonly workspaceId: WorkspaceId;
  readonly tier: PlanTier;
  readonly status: SubscriptionStatus;
  readonly stripeSubscriptionId: string | null;
  readonly createdAt: string;
}