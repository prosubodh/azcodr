import type { WorkspaceId } from './ids.ts';
import { newId } from './ids.ts';
import type { PlanTier, Subscription, SubscriptionStatus } from './plans.ts';
import { ValidationError } from './errors.ts';

export interface NewSubscription {
  readonly workspaceId: WorkspaceId;
  readonly tier: PlanTier;
  readonly status?: SubscriptionStatus;
  readonly stripeSubscriptionId?: string;
}

/** Factory guarding the subscription invariant: only known tiers/statuses. */
export function createSubscription(input: NewSubscription): Subscription {
  if (!input.workspaceId) {
    throw new ValidationError('A workspace is required for a subscription.', 'INVALID_SUBSCRIPTION');
  }
  return {
    id: newId('sub') as Subscription['id'],
    workspaceId: input.workspaceId,
    tier: input.tier,
    status: input.status ?? 'trialing',
    stripeSubscriptionId: input.stripeSubscriptionId ?? null,
    createdAt: new Date().toISOString()
  };
}