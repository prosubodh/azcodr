import type { MembershipRepositoryPort, OutboxRepositoryPort, WorkspaceRepositoryPort } from '../domain/ports/repositories.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { createWorkspace, type Membership, type Workspace } from '../domain/workspace.ts';
import { createOutboxEntry } from '../domain/outbox.ts';
import { NotFoundError } from '../domain/errors.ts';

export interface WorkspaceDeps {
  readonly workspaceRepository: WorkspaceRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
}

export interface CreateWorkspaceCommand {
  readonly name: string;
  readonly createdBy: UserId;
}

export interface CreateWorkspaceResult {
  readonly workspace: Workspace;
  readonly membership: Membership;
}

/**
 * Creates a workspace, its founding Owner membership, and the WorkspaceCreated
 * outbox event atomically inside one transaction (Transactional Outbox).
 */
export async function createWorkspaceForUser(
  deps: WorkspaceDeps,
  command: CreateWorkspaceCommand
): Promise<CreateWorkspaceResult> {
  return deps.unitOfWork.run(async () => {
    const created = createWorkspace(command);
    await deps.workspaceRepository.create(created.workspace);
    await deps.membershipRepository.create(created.membership);
    await deps.outboxRepository.stage(
      createOutboxEntry({
        type: 'WorkspaceCreated',
        aggregateId: created.workspace.id,
        payload: { name: created.workspace.name }
      })
    );
    return created;
  });
}

export interface ReadWorkspaceQuery {
  readonly workspaceId: WorkspaceId;
  readonly actorUserId: UserId;
}

/**
 * Tenant-scoped workspace read. A missing membership is masked as 404 — the
 * resource does not exist *for this caller* (enumeration masking).
 */
export async function getWorkspaceScoped(deps: WorkspaceDeps, query: ReadWorkspaceQuery): Promise<Workspace> {
  const membership = await deps.membershipRepository.findByUserAndWorkspace(query.actorUserId, query.workspaceId);
  if (membership === null) {
    throw new NotFoundError('Workspace not found.', 'WORKSPACE_NOT_FOUND');
  }
  const workspace = await deps.workspaceRepository.findById(query.workspaceId);
  if (workspace === null) {
    throw new NotFoundError('Workspace not found.', 'WORKSPACE_NOT_FOUND');
  }
  return workspace;
}

/** Lists only the workspaces the caller belongs to (partitioned by membership). */
export async function listWorkspacesForMember(deps: WorkspaceDeps, actorUserId: UserId): Promise<Workspace[]> {
  const owned = await deps.membershipRepository.listByUser(actorUserId);
  const workspaces: Workspace[] = [];
  for (const membership of owned) {
    const workspace = await deps.workspaceRepository.findById(membership.workspaceId);
    if (workspace !== null) workspaces.push(workspace);
  }
  return workspaces;
}