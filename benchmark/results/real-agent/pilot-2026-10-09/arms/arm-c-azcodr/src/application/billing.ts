import type { MembershipRepositoryPort, SubscriptionRepositoryPort } from '../domain/ports/repositories.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { isFeatureId, planAllows, type FeatureId, type PlanTier } from '../domain/plans.ts';
import { ForbiddenError, NotFoundError, ValidationError } from '../domain/errors.ts';

export interface BillingDeps {
  readonly subscriptionRepository: SubscriptionRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
}

export interface FeatureCheckQuery {
  readonly workspaceId: WorkspaceId;
  readonly actorUserId: UserId;
  readonly feature: string;
}

export interface FeatureCheckResult {
  readonly allowed: true;
  readonly tier: PlanTier;
}

/**
 * Enforces subscription feature gates per workspace (free vs pro). Depends
 * only on the shared plans contract + ports — never on tenancy internals.
 */
export async function checkFeatureAccess(deps: BillingDeps, query: FeatureCheckQuery): Promise<FeatureCheckResult> {
  const membership = await deps.membershipRepository.findByUserAndWorkspace(query.actorUserId, query.workspaceId);
  if (membership === null) {
    throw new NotFoundError('Workspace not found.', 'WORKSPACE_NOT_FOUND');
  }
  if (!isFeatureId(query.feature)) {
    throw new ValidationError(`Unknown feature '${query.feature}'.`, 'UNKNOWN_FEATURE');
  }
  const subscription = await deps.subscriptionRepository.findByWorkspaceId(query.workspaceId);
  // Entitlement invariant: only active subscriptions grant pro features.
  const tier: PlanTier = subscription !== null && subscription.status === 'active' ? subscription.tier : 'free';
  if (!planAllows(tier, query.feature as FeatureId)) {
    throw new ForbiddenError(`Feature '${query.feature}' requires a pro subscription.`, 'FEATURE_NOT_AVAILABLE');
  }
  return { allowed: true, tier };
}