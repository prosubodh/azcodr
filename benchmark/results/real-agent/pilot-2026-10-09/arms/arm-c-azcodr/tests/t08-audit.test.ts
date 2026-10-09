import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestApp, registerAndLogin, createWorkspaceAs } from './helpers/app.ts';
import { createAuditHandlers } from '../src/transport/audit.ts';
import { createAuditEntry } from '../src/domain/audit.ts';
import type { WorkspaceId } from '../src/domain/ids.ts';

test('audit listing is newest-first and returns an opaque nextCursor to continue', async () => {
  const app = createTestApp();
  const audit = createAuditHandlers({
    auditRepository: app.store.auditRepository,
    membershipRepository: app.store.membershipRepository,
    tokenSigner: app.tokenSigner
  });
  const token = await registerAndLogin(app, 'auditor@example.com');
  const workspaceId = await createWorkspaceAs(app, token, 'Audit Org');

  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'MemberInvited', occurredAt: '2026-10-09T10:00:01.000Z' }));
  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'MemberRoleChanged', occurredAt: '2026-10-09T10:00:02.000Z' }));
  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'WorkspaceCreated', occurredAt: '2026-10-09T10:00:03.000Z' }));

  const res = await audit.listAudit({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/audit?limit=2`,
    headers: { authorization: `Bearer ${token}` }
  });

  assert.equal(res.status, 200);
  const body = res.body as { records: Array<{ action: string; occurredAt: string }>; nextCursor: string | null };
  assert.deepEqual(
    body.records.map((r) => r.action),
    ['WorkspaceCreated', 'MemberRoleChanged']
  );
  assert.equal(typeof body.nextCursor, 'string');
  assert.notEqual(body.nextCursor, null);
});

test('passing nextCursor returns only strictly-older records with no duplicates', async () => {
  const app = createTestApp();
  const audit = createAuditHandlers({
    auditRepository: app.store.auditRepository,
    membershipRepository: app.store.membershipRepository,
    tokenSigner: app.tokenSigner
  });
  const token = await registerAndLogin(app, 'pager@example.com');
  const workspaceId = await createWorkspaceAs(app, token, 'Paged Org');

  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'MemberInvited', occurredAt: '2026-10-09T11:00:01.000Z' }));
  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'MemberRoleChanged', occurredAt: '2026-10-09T11:00:02.000Z' }));
  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'WorkspaceCreated', occurredAt: '2026-10-09T11:00:03.000Z' }));

  const first = await audit.listAudit({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/audit?limit=2`,
    headers: { authorization: `Bearer ${token}` }
  });
  const firstBody = first.body as { records: Array<{ action: string; occurredAt: string }>; nextCursor: string | null };
  assert.deepEqual(firstBody.records.map((r) => r.action), ['WorkspaceCreated', 'MemberRoleChanged']);
  assert.equal(typeof firstBody.nextCursor, 'string');

  const second = await audit.listAudit({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/audit?limit=2&cursor=${encodeURIComponent(firstBody.nextCursor ?? '')}`,
    headers: { authorization: `Bearer ${token}` }
  });
  const secondBody = second.body as { records: Array<{ action: string }>; nextCursor: string | null };
  assert.deepEqual(secondBody.records.map((r) => r.action), ['MemberInvited']);
  assert.equal(secondBody.nextCursor, null);
  assert.equal((app.store.audit as unknown[]).length, 3);
});

test('audit logs are tenant-scoped: a non-member gets a masked 404', async () => {
  const app = createTestApp();
  const audit = createAuditHandlers({
    auditRepository: app.store.auditRepository,
    membershipRepository: app.store.membershipRepository,
    tokenSigner: app.tokenSigner
  });
  const ownerToken = await registerAndLogin(app, 'owner8@example.com');
  const outsiderToken = await registerAndLogin(app, 'outsider8@example.com');
  const workspaceId = await createWorkspaceAs(app, ownerToken, 'Private Org');
  await app.store.auditRepository.append(createAuditEntry({ workspaceId, action: 'WorkspaceCreated', occurredAt: '2026-10-09T12:00:01.000Z' }));

  const res = await audit.listAudit({
    method: 'GET',
    path: `/v1/workspaces/${workspaceId}/audit`,
    headers: { authorization: `Bearer ${outsiderToken}` }
  });

  assert.equal(res.status, 404);
});