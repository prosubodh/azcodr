import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import type { StripeSignatureVerifierPort } from '../domain/ports/payment.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';
import type { OutboxRepositoryPort, SubscriptionRepositoryPort } from '../domain/ports/repositories.ts';
import { createStripeEvent } from '../domain/payment.ts';
import { applyStripeEvent, type StripeWebhookDeps } from '../application/payment.ts';

export interface StripeHandlersDeps {
  readonly subscriptionRepository: SubscriptionRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
  readonly signatureVerifier: StripeSignatureVerifierPort;
}

export interface StripeHandlers {
  readonly handleWebhook: HttpHandler;
}

/**
 * /v1/webhooks/stripe — server-to-server. NOTE: the signature covers the exact
 * raw bytes, so `req.body` must be the raw string payload (not a parsed object).
 */
export function createStripeHandlers(deps: StripeHandlersDeps): StripeHandlers {
  const appDeps: StripeWebhookDeps = {
    subscriptionRepository: deps.subscriptionRepository,
    outboxRepository: deps.outboxRepository,
    unitOfWork: deps.unitOfWork
  };
  return {
    handleWebhook: async (req) => {
      try {
        const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body ?? '');
        const signature = String(req.headers['stripe-signature'] ?? '');
        if (!deps.signatureVerifier.verify(payload, signature)) {
          return {
            status: 400,
            body: { title: 'Bad Request', status: 400, code: 'INVALID_SIGNATURE', detail: 'Webhook signature verification failed.' }
          };
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(payload);
        } catch {
          return {
            status: 400,
            body: { title: 'Bad Request', status: 400, code: 'MALFORMED_BODY', detail: 'Webhook payload is not valid JSON.' }
          };
        }
        const result = await applyStripeEvent(appDeps, createStripeEvent(parsed as { id?: unknown; type?: unknown; data?: unknown }));
        return { status: 200, body: { received: true, ...result } };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}