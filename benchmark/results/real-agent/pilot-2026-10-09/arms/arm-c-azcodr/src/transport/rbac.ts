import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import { requireUser } from './authGuard.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import type { AuditRepositoryPort, MembershipRepositoryPort, OutboxRepositoryPort, UserRepositoryPort } from '../domain/ports/repositories.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { isMemberRole } from '../domain/roles.ts';
import { ValidationError } from '../domain/errors.ts';
import { inviteMember, type RbacDeps } from '../application/rbac.ts';

export interface RbacHandlersDeps {
  readonly userRepository: UserRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly auditRepository: AuditRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
  readonly tokenSigner: TokenSignerPort;
}

export interface RbacHandlers {
  readonly inviteMember: HttpHandler;
}

/** /v1/workspaces/:workspaceId/members */
function parseMembersPath(path: string): WorkspaceId | null {
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length !== 4 || segments[0] !== 'v1' || segments[1] !== 'workspaces' || segments[3] !== 'members') {
    return null;
  }
  return segments[2] as WorkspaceId;
}

export function createRbacHandlers(deps: RbacHandlersDeps): RbacHandlers {
  const appDeps: RbacDeps = {
    userRepository: deps.userRepository,
    membershipRepository: deps.membershipRepository,
    outboxRepository: deps.outboxRepository,
    auditRepository: deps.auditRepository,
    unitOfWork: deps.unitOfWork
  };
  return {
    inviteMember: async (req) => {
      try {
        const claims = await requireUser(deps, req.headers);
        const workspaceId = parseMembersPath(req.path);
        if (workspaceId === null) {
          return { status: 404, body: { code: 'NOT_FOUND', detail: 'Unknown endpoint.' } };
        }
        const body = (req.body ?? {}) as { email?: unknown; role?: unknown };
        if (typeof body.email !== 'string' || body.email.trim().length === 0) {
          throw new ValidationError('An email is required.', 'INVALID_INVITE');
        }
        if (typeof body.role !== 'string' || !isMemberRole(body.role)) {
          throw new ValidationError('A valid role is required.', 'INVALID_INVITE');
        }
        const membership = await inviteMember(appDeps, {
          workspaceId,
          actorUserId: claims.sub as UserId,
          email: body.email,
          role: body.role
        });
        return { status: 201, body: { membership } };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}