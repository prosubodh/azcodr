import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, registerAndLogin, createWorkspaceAs } from './helpers/app.ts';
import { createRbacHandlers } from '../src/transport/rbac.ts';
import type { OutboxEntry } from '../src/domain/outbox.ts';
import type { AuditEntry } from '../src/domain/audit.ts';

function makeApp() {
  const app = createTestApp();
  const rbac = createRbacHandlers({
    userRepository: app.store.userRepository,
    membershipRepository: app.store.membershipRepository,
    outboxRepository: app.store.outboxRepository,
    auditRepository: app.store.auditRepository,
    unitOfWork: app.unitOfWork,
    tokenSigner: app.tokenSigner
  });
  return { app, rbac };
}

test('an Owner can invite a user into a lower role (201)', async () => {
  const { app, rbac } = makeApp();
  const ownerToken = await registerAndLogin(app, 'rbac-owner@example.com');
  await registerAndLogin(app, 'dev@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Rbac Org');

  const res = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'dev@example.com', role: 'Member' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });

  assert.equal(res.status, 201);
  const invited = (res.body as { membership: { userId: string; role: string } }).membership;
  assert.equal(invited.role, 'Member');
  assert.equal(app.store.memberships.length, 2);
  assert.equal((app.store.outbox as OutboxEntry[]).some((e) => e.type === 'MemberInvited'), true);
  assert.equal((app.store.audit as AuditEntry[]).some((e) => e.action === 'MemberInvited'), true);
});

test('a Viewer cannot invite anyone (403 ROLE_NOT_ALLOWED)', async () => {
  const { app, rbac } = makeApp();
  const ownerToken = await registerAndLogin(app, 'owner-v@example.com');
  const viewerToken = await registerAndLogin(app, 'viewer@example.com');
  await registerAndLogin(app, 'v-target@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Viewer Org');

  const inviteViewer = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'viewer@example.com', role: 'Viewer' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(inviteViewer.status, 201);

  const denied = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'v-target@example.com', role: 'Member' },
    headers: { authorization: `Bearer ${viewerToken}` }
  });
  assert.equal(denied.status, 403);
  assert.equal((denied.body as { code?: string }).code, 'ROLE_NOT_ALLOWED');
  assert.equal(app.store.memberships.length, 2);
});

test('an Admin can invite below themselves but not peers or superiors', async () => {
  const { app, rbac } = makeApp();
  const ownerToken = await registerAndLogin(app, 'owner-a@example.com');
  const adminToken = await registerAndLogin(app, 'admin@example.com');
  await registerAndLogin(app, 'member-a@example.com');
  await registerAndLogin(app, 'owner2@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Admin Org');

  const makeAdmin = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'admin@example.com', role: 'Admin' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(makeAdmin.status, 201);

  const invitesMember = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'member-a@example.com', role: 'Member' },
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert.equal(invitesMember.status, 201);

  const invitesPeer = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'owner2@example.com', role: 'Admin' },
    headers: { authorization: `Bearer ${adminToken}` }
  });
  assert.equal(invitesPeer.status, 403);
});

test('invites reject invalid roles and unknown emails', async () => {
  const { app, rbac } = makeApp();
  const ownerToken = await registerAndLogin(app, 'owner-b@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Strict Org');

  const badRole = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'ghost@example.com', role: 'SuperAdmin' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(badRole.status, 422);

  const unknownUser = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'ghost@example.com', role: 'Member' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(unknownUser.status, 404);
});

test('duplicate invites conflict and non-members get a masked 404', async () => {
  const { app, rbac } = makeApp();
  const ownerToken = await registerAndLogin(app, 'owner-c@example.com');
  const outsiderToken = await registerAndLogin(app, 'outsider-c@example.com');
  await registerAndLogin(app, 'dup@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Dup Org');

  const first = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'dup@example.com', role: 'Member' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(first.status, 201);

  const again = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'dup@example.com', role: 'Viewer' },
    headers: { authorization: `Bearer ${ownerToken}` }
  });
  assert.equal(again.status, 409);
  assert.equal((again.body as { code?: string }).code, 'MEMBERSHIP_EXISTS');

  const masked = await rbac.inviteMember({
    method: 'POST',
    path: `/v1/workspaces/${workspaceId}/members`,
    body: { email: 'dup@example.com', role: 'Member' },
    headers: { authorization: `Bearer ${outsiderToken}` }
  });
  assert.equal(masked.status, 404);
});