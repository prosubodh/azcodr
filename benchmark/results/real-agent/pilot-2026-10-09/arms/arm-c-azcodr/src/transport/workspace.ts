import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import { requireUser } from './authGuard.ts';
import { NotFoundError } from '../domain/errors.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';
import type { MembershipRepositoryPort, OutboxRepositoryPort, WorkspaceRepositoryPort } from '../domain/ports/repositories.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import {
  createWorkspaceForUser,
  getWorkspaceScoped,
  listWorkspacesForMember,
  type WorkspaceDeps
} from '../application/workspace.ts';

export interface WorkspaceHandlersDeps {
  readonly workspaceRepository: WorkspaceRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
  readonly tokenSigner: TokenSignerPort;
}

export interface WorkspaceHandlers {
  readonly createWorkspace: HttpHandler;
  readonly getWorkspace: HttpHandler;
  readonly listWorkspaces: HttpHandler;
}

/** /v1/workspaces and /v1/workspaces/:workspaceId */
function parseWorkspacePath(path: string): { workspaceId: WorkspaceId | null } {
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length === 2 && segments[0] === 'v1' && segments[1] === 'workspaces') return { workspaceId: null };
  if (segments.length === 3 && segments[0] === 'v1' && segments[1] === 'workspaces') {
    return { workspaceId: segments[2] as WorkspaceId };
  }
  return { workspaceId: 'invalid' as WorkspaceId };
}

export function createWorkspaceHandlers(deps: WorkspaceHandlersDeps): WorkspaceHandlers {
  const appDeps: WorkspaceDeps = {
    workspaceRepository: deps.workspaceRepository,
    membershipRepository: deps.membershipRepository,
    outboxRepository: deps.outboxRepository,
    unitOfWork: deps.unitOfWork
  };
  return {
    createWorkspace: async (req) => {
      try {
        const claims = await requireUser(deps, req.headers);
        const body = (req.body ?? {}) as { name?: string };
        const result = await createWorkspaceForUser(appDeps, {
          name: String(body.name ?? ''),
          createdBy: claims.sub as UserId
        });
        return { status: 201, body: { workspace: result.workspace, role: result.membership.role } };
      } catch (error) {
        return toProblem(error);
      }
    },
    getWorkspace: async (req) => {
      try {
        const claims = await requireUser(deps, req.headers);
        const { workspaceId } = parseWorkspacePath(req.path);
        if (workspaceId === null) {
          throw new NotFoundError('Workspace not found.', 'WORKSPACE_NOT_FOUND');
        }
        const workspace = await getWorkspaceScoped(appDeps, {
          workspaceId,
          actorUserId: claims.sub as UserId
        });
        return { status: 200, body: { workspace } };
      } catch (error) {
        return toProblem(error);
      }
    },
    listWorkspaces: async (req) => {
      try {
        const claims = await requireUser(deps, req.headers);
        const workspaces = await listWorkspacesForMember(appDeps, claims.sub as UserId);
        return { status: 200, body: { workspaces } };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}