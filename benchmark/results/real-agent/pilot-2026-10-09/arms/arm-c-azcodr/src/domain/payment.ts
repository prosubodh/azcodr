import { ValidationError } from './errors.ts';

export const STRIPE_EVENT_INVOICE_PAID = 'invoice.paid';

/**
 * Canonical Stripe webhook event (the subset we react to). The raw provider
 * payload is parsed at the transport edge and validated into this typed
 * domain form before any payment logic runs.
 */
export interface StripeEvent {
  readonly id: string;
  readonly type: string;
  readonly data: { readonly object: Record<string, unknown> };
}

/** Validates an untrusted webhook payload into a typed domain event. */
export function createStripeEvent(input: { id?: unknown; type?: unknown; data?: unknown }): StripeEvent {
  if (typeof input.id !== 'string' || typeof input.type !== 'string') {
    throw new ValidationError('Malformed Stripe event.', 'INVALID_STRIPE_EVENT');
  }
  const object = (input.data as { object?: unknown } | undefined)?.object;
  if (typeof object !== 'object' || object === null || Array.isArray(object)) {
    throw new ValidationError('Stripe event is missing data.object.', 'INVALID_STRIPE_EVENT');
  }
  return { id: input.id, type: input.type, data: { object: object as Record<string, unknown> } };
}