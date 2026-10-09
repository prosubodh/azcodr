import type { OutboxRepositoryPort, SubscriptionRepositoryPort } from '../domain/ports/repositories.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';
import { STRIPE_EVENT_INVOICE_PAID, type StripeEvent } from '../domain/payment.ts';
import { createOutboxEntry } from '../domain/outbox.ts';
import { NotFoundError, ValidationError } from '../domain/errors.ts';

export interface StripeWebhookDeps {
  readonly subscriptionRepository: SubscriptionRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
}

export interface StripeApplicationResult {
  readonly applied: boolean;
  readonly event: string;
}

/**
 * Applies a (verified) Stripe event to the payment domain. Reacts only through
 * ports: no transport, no database handles — persistence goes through
 * SubscriptionRepositoryPort and delivery through the transactional outbox
 * inside the UnitOfWork, so entitlement + event commit or roll back together.
 */
export async function applyStripeEvent(deps: StripeWebhookDeps, event: StripeEvent): Promise<StripeApplicationResult> {
  if (event.type !== STRIPE_EVENT_INVOICE_PAID) {
    return { applied: false, event: event.type };
  }
  const stripeSubscriptionId = String(event.data.object.subscription ?? '');
  if (stripeSubscriptionId.length === 0) {
    throw new ValidationError('invoice.paid event is missing the subscription id.', 'INVALID_STRIPE_EVENT');
  }

  return deps.unitOfWork.run(async () => {
    const current = await deps.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (current === null) {
      throw new NotFoundError('No subscription matches this Stripe account.', 'SUBSCRIPTION_NOT_FOUND');
    }
    const activated = { ...current, status: 'active' as const };
    await deps.subscriptionRepository.upsert(activated);
    await deps.outboxRepository.stage(
      createOutboxEntry({
        type: 'SubscriptionActivated',
        aggregateId: current.workspaceId,
        payload: { tier: current.tier, stripeSubscriptionId }
      })
    );
    return { applied: true, event: event.type };
  });
}