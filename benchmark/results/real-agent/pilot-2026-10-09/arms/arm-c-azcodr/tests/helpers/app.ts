import { createAuthHandlers } from '../../src/transport/auth.ts';
import { createWorkspaceHandlers } from '../../src/transport/workspace.ts';
import { createBillingHandlers } from '../../src/transport/billing.ts';
import { createInMemoryStore } from '../../src/adapters/memoryStore.ts';
import { createUnitOfWork } from '../../src/adapters/unitOfWork.ts';
import { scryptPasswordHasher } from '../../src/adapters/passwordHasher.ts';
import { createJwtSigner } from '../../src/adapters/jwtSigner.ts';
import type { WorkspaceId } from '../../src/domain/ids.ts';

/**
 * Deterministic test composition root (docs/rules/design_patterns.md): wires
 * the full dependency graph with the in-memory adapters. Owned types only.
 */
export function createTestApp() {
  const store = createInMemoryStore();
  const unitOfWork = createUnitOfWork(store);
  const tokenSigner = createJwtSigner({ secret: 'test-only-secret', ttlSeconds: 900 });
  const auth = createAuthHandlers({
    userRepository: store.userRepository,
    passwordHasher: scryptPasswordHasher,
    tokenSigner
  });
  const workspace = createWorkspaceHandlers({
    workspaceRepository: store.workspaceRepository,
    membershipRepository: store.membershipRepository,
    outboxRepository: store.outboxRepository,
    unitOfWork,
    tokenSigner
  });
  const billing = createBillingHandlers({
    subscriptionRepository: store.subscriptionRepository,
    membershipRepository: store.membershipRepository,
    tokenSigner
  });
  return { store, unitOfWork, tokenSigner, auth, workspace, billing };
}

export async function registerAndLogin(app: ReturnType<typeof createTestApp>, email: string): Promise<string> {
  await app.auth.register({ method: 'POST', path: '/v1/auth/register', body: { email, password: 'pass-1234!' }, headers: {} });
  const res = await app.auth.login({ method: 'POST', path: '/v1/auth/login', body: { email, password: 'pass-1234!' }, headers: {} });
  return (res.body as { accessToken: string }).accessToken;
}

export async function createWorkspaceAs(app: ReturnType<typeof createTestApp>, token: string, name: string): Promise<WorkspaceId> {
  const res = await app.workspace.createWorkspace({
    method: 'POST',
    path: '/v1/workspaces',
    body: { name },
    headers: { authorization: `Bearer ${token}` }
  });
  return ((res.body as { workspace: { id: string } }).workspace).id as WorkspaceId;
}