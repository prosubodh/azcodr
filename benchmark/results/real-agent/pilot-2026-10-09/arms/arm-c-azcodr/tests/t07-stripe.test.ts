import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { createStripeHandlers } from '../src/transport/stripe.ts';
import { createStripeSignatureVerifier } from '../src/adapters/stripeSignatureVerifier.ts';
import { createInMemoryStore } from '../src/adapters/memoryStore.ts';
import { createUnitOfWork } from '../src/adapters/unitOfWork.ts';
import { createSubscription } from '../src/domain/subscription.ts';
import type { WorkspaceId } from '../src/domain/ids.ts';
import type { OutboxEntry } from '../src/domain/outbox.ts';

const SECRET = 'whsec_test';

/** Mimics Stripe's signature header: t=<unix seconds>,v1=<hmac-sha256 hex>. */
function sign(payload: string, t = Math.floor(Date.now() / 1000).toString()): string {
  const hex = createHmac('sha256', SECRET).update(`${t}.${payload}`).digest('hex');
  return `t=${t},v1=${hex}`;
}

function makeApp() {
  const store = createInMemoryStore();
  const unitOfWork = createUnitOfWork(store);
  const stripe = createStripeHandlers({
    subscriptionRepository: store.subscriptionRepository,
    outboxRepository: store.outboxRepository,
    unitOfWork,
    signatureVerifier: createStripeSignatureVerifier({ secret: SECRET })
  });
  return { store, stripe };
}

test('a valid invoice.paid webhook activates the subscription and stages SubscriptionActivated', async () => {
  const { store, stripe } = makeApp();
  await store.subscriptionRepository.upsert(
    createSubscription({ workspaceId: 'ws_pay_1' as WorkspaceId, tier: 'pro', status: 'trialing', stripeSubscriptionId: 'sub_123' })
  );

  const payload = JSON.stringify({
    id: 'evt_inv_1',
    type: 'invoice.paid',
    data: { object: { subscription: 'sub_123', customer: 'cus_9' } }
  });

  const res = await stripe.handleWebhook({
    method: 'POST',
    path: '/v1/webhooks/stripe',
    body: payload,
    headers: { 'stripe-signature': sign(payload) }
  });

  assert.equal(res.status, 200);
  assert.equal(store.subscriptions[0]?.status, 'active');
  const outbox = store.outbox as OutboxEntry[];
  assert.equal(outbox.length, 1);
  assert.equal(outbox[0]?.type, 'SubscriptionActivated');
  assert.equal(outbox[0]?.status, 'PENDING');
});

test('a webhook with a tampered signature is rejected with 400', async () => {
  const { stripe } = makeApp();
  const payload = JSON.stringify({ id: 'evt_inv_x', type: 'invoice.paid', data: { object: { subscription: 'sub_123' } } });

  const tampered = payload.slice(0, payload.length - 1) + '!';
  const res = await stripe.handleWebhook({
    method: 'POST',
    path: '/v1/webhooks/stripe',
    body: tampered,
    headers: { 'stripe-signature': sign(payload, Math.floor(Date.now() / 1000).toString()) }
  });

  assert.equal(res.status, 400);
  assert.equal((res.body as { code?: string }).code, 'INVALID_SIGNATURE');
});

test('a signature signed with the wrong secret is rejected with 400', async () => {
  const { stripe } = makeApp();
  const payload = JSON.stringify({ id: 'evt_inv_y', type: 'invoice.paid', data: { object: { subscription: 'sub_123' } } });
  const forged = createHmac('sha256', 'whsec_attacker').update(`${Math.floor(Date.now() / 1000)}.${payload}`).digest('hex');
  const header = `t=${Math.floor(Date.now() / 1000)},v1=${forged}`;

  const res = await stripe.handleWebhook({ method: 'POST', path: '/v1/webhooks/stripe', body: payload, headers: { 'stripe-signature': header } });
  assert.equal(res.status, 400);
});

test('unhandled event types are acknowledged without mutating state', async () => {
  const { store, stripe } = makeApp();
  await store.subscriptionRepository.upsert(
    createSubscription({ workspaceId: 'ws_ign_1' as WorkspaceId, tier: 'pro', status: 'active', stripeSubscriptionId: 'sub_ign' })
  );
  const payload = JSON.stringify({ id: 'evt_ref_1', type: 'charge.refunded', data: { object: { id: 'ch_1' } } });

  const res = await stripe.handleWebhook({ method: 'POST', path: '/v1/webhooks/stripe', body: payload, headers: { 'stripe-signature': sign(payload) } });

  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { received: true, applied: false, event: 'charge.refunded' });
  assert.equal(store.subscriptions[0]?.status, 'active');
  assert.equal((store.outbox as OutboxEntry[]).length, 0);
});

test('an invoice.paid for an unknown subscription returns 404 and changes nothing', async () => {
  const { store, stripe } = makeApp();
  const payload = JSON.stringify({ id: 'evt_inv_z', type: 'invoice.paid', data: { object: { subscription: 'sub_ghost' } } });

  const res = await stripe.handleWebhook({ method: 'POST', path: '/v1/webhooks/stripe', body: payload, headers: { 'stripe-signature': sign(payload) } });

  assert.equal(res.status, 404);
  assert.equal((res.body as { code?: string }).code, 'SUBSCRIPTION_NOT_FOUND');
  assert.equal((store.outbox as OutboxEntry[]).length, 0);
});