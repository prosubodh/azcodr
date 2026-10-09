import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, registerAndLogin, createWorkspaceAs } from './helpers/app.ts';
import { createSubscription } from '../src/domain/subscription.ts';

test('a free workspace is denied a pro feature (403)', async () => {
  const app = createTestApp();
  const token = await registerAndLogin(app, 'freeloader@example.com');
  const workspaceId = await createWorkspaceAs(app, token, 'Free Org');

  const res = await app.billing.checkFeature({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/features/advanced-audit`,
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 403);
  assert.equal((res.body as { code?: string }).code, 'FEATURE_NOT_AVAILABLE');
});

test('a pro subscription unlocks the pro feature', async () => {
  const app = createTestApp();
  const token = await registerAndLogin(app, 'probie@example.com');
  const workspaceId = await createWorkspaceAs(app, token, 'Pro Org');
  await app.store.subscriptionRepository.upsert(createSubscription({ workspaceId, tier: 'pro', status: 'active' }));

  const res = await app.billing.checkFeature({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/features/advanced-audit`,
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { allowed: true, tier: 'pro' });
});

test('an inactive subscription falls back to the free tier', async () => {
  const app = createTestApp();
  const token = await registerAndLogin(app, 'lapsed@example.com');
  const workspaceId = await createWorkspaceAs(app, token, 'Lapsed Org');
  await app.store.subscriptionRepository.upsert(createSubscription({ workspaceId, tier: 'pro', status: 'canceled' }));

  const res = await app.billing.checkFeature({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/features/unlimited-members`,
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 403);
});

test('unknown features are rejected and other tenants cannot probe features', async () => {
  const app = createTestApp();
  const ownerToken = await registerAndLogin(app, 'owner@example.com');
  const outsiderToken = await registerAndLogin(app, 'outsider@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Gated Org');

  const unknown = await app.billing.checkFeature({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/features/teleport`,
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(unknown.status, 422);

  const crossTenant = await app.billing.checkFeature({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/features/advanced-audit`,
    headers: { authorization: `Bearer ${outsiderToken}` }
  });
  assert.equal(crossTenant.status, 404);
});