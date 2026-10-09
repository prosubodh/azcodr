import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { UserId } from '../src/domain/ids.ts';
import { createTestApp, registerAndLogin } from './helpers/app.ts';

test('creating a workspace makes the creator the Owner', async () => {
  const app = createTestApp();
  const token = await registerAndLogin(app, 'owner@example.com');
  const res = await app.workspace.createWorkspace({
    method: 'POST',
    path: '/v1/workspaces',
    body: { name: 'Acme Org' },
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 201);
  const creator = app.store.users[0] as { id: UserId };
  assert.equal(app.store.workspaces.length, 1);
  assert.equal(app.store.memberships.length, 1);
  assert.equal(app.store.memberships[0]?.role, 'Owner');
  assert.equal(app.store.memberships[0]?.userId, creator.id);
  assert.equal(app.store.memberships[0]?.workspaceId, app.store.workspaces[0]?.id);
});

test('the owner can read their workspace', async () => {
  const app = createTestApp();
  const token = await registerAndLogin(app, 'owner-a@example.com');
  const created = await app.workspace.createWorkspace({
    method: 'POST',
    path: '/v1/workspaces',
    body: { name: 'Team Alpha' },
    headers: { authorization: `Bearer ${token}` }
  });
  const workspaceId = ((created.body as { workspace: { id: string } }).workspace).id;

  const res = await app.workspace.getWorkspace({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}`,
    headers: { authorization: `Bearer ${token}` }
  });
  assert.equal(res.status, 200);
  assert.equal((res.body as { workspace: { name: string } }).workspace.name, 'Team Alpha');
});

test('a non-member cannot read another tenant workspace (masked 404)', async () => {
  const app = createTestApp();
  const ownerToken = await registerAndLogin(app, 'owner-b@example.com');
  const intruderToken = await registerAndLogin(app, 'intruder@example.com');
  const created = await app.workspace.createWorkspace({
    method: 'POST',
    path: '/v1/workspaces',
    body: { name: 'Secret Org' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  const workspaceId = ((created.body as { workspace: { id: string } }).workspace).id;

  const res = await app.workspace.getWorkspace({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}`,
    headers: { authorization: `Bearer ${intruderToken}` }
  });
  assert.equal(res.status, 404);
});

test('workspace listing is partitioned by membership', async () => {
  const app = createTestApp();
  const tokenA = await registerAndLogin(app, 'owner-c@example.com');
  const tokenB = await registerAndLogin(app, 'owner-d@example.com');
  await app.workspace.createWorkspace({ method: 'POST', path: '/v1/workspaces', body: { name: 'Workspace A' }, headers: { authorization: `Bearer ${tokenA}` } });
  await app.workspace.createWorkspace({ method: 'POST', path: '/v1/workspaces', body: { name: 'Workspace B' }, headers: { authorization: `Bearer ${tokenB}` } });

  const listA = await app.workspace.listWorkspaces({ method: 'GET', path: '/v1/workspaces', headers: { authorization: `Bearer ${tokenA}` } });
  const listB = await app.workspace.listWorkspaces({ method: 'GET', path: '/v1/workspaces', headers: { authorization: `Bearer ${tokenB}` } });
  assert.deepEqual(
    (listA.body as { workspaces: Array<{ name: string }> }).workspaces.map((w) => w.name),
    ['Workspace A']
  );
  assert.deepEqual(
    (listB.body as { workspaces: Array<{ name: string }> }).workspaces.map((w) => w.name),
    ['Workspace B']
  );
  assert.equal(app.store.workspaces.length, 2);
});

test('workspace endpoints require authentication', async () => {
  const app = createTestApp();
  const res = await app.workspace.listWorkspaces({
    method: 'GET',
    path: '/v1/workspaces',
    headers: {}
  });
  assert.equal(res.status, 401);
});