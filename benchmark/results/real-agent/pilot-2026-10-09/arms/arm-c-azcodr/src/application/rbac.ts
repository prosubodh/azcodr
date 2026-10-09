import type { AuditRepositoryPort, MembershipRepositoryPort, OutboxRepositoryPort, UserRepositoryPort } from '../domain/ports/repositories.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { createMembership, type MemberRole, type Membership } from '../domain/workspace.ts';
import { canInviteRole } from '../domain/roles.ts';
import { createOutboxEntry } from '../domain/outbox.ts';
import { createAuditEntry } from '../domain/audit.ts';
import { ConflictError, ForbiddenError, NotFoundError } from '../domain/errors.ts';

export interface RbacDeps {
  readonly userRepository: UserRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly auditRepository: AuditRepositoryPort;
  readonly unitOfWork: UnitOfWorkPort;
}

export interface InviteMemberCommand {
  readonly workspaceId: WorkspaceId;
  readonly actorUserId: UserId;
  readonly email: string;
  readonly role: MemberRole;
}

/**
 * Invites a registered user into a workspace role. Tenancy masking (404 for
 * non-members), role governance (403), and the membership + outbox event +
 * audit trail commit inside one transaction.
 */
export async function inviteMember(deps: RbacDeps, command: InviteMemberCommand): Promise<Membership> {
  const actorMembership = await deps.membershipRepository.findByUserAndWorkspace(command.actorUserId, command.workspaceId);
  if (actorMembership === null) {
    throw new NotFoundError('Workspace not found.', 'WORKSPACE_NOT_FOUND');
  }
  if (!canInviteRole(actorMembership.role, command.role)) {
    throw new ForbiddenError('Your role cannot invite into this role.', 'ROLE_NOT_ALLOWED');
  }
  const target = await deps.userRepository.findByEmail(command.email);
  if (target === null) {
    throw new NotFoundError('No user has this email.', 'USER_NOT_FOUND');
  }

  return deps.unitOfWork.run(async () => {
    const existing = await deps.membershipRepository.findByUserAndWorkspace(target.id, command.workspaceId);
    if (existing !== null) {
      throw new ConflictError('This user is already a member.', 'MEMBERSHIP_EXISTS');
    }
    const membership = createMembership({
      workspaceId: command.workspaceId,
      userId: target.id,
      role: command.role
    });
    await deps.membershipRepository.create(membership);
    await deps.outboxRepository.stage(
      createOutboxEntry({
        type: 'MemberInvited',
        aggregateId: command.workspaceId,
        payload: { userId: target.id, role: command.role }
      })
    );
    await deps.auditRepository.append(
      createAuditEntry({
        workspaceId: command.workspaceId,
        actorUserId: command.actorUserId,
        action: 'MemberInvited',
        details: { userId: target.id, role: command.role }
      })
    );
    return membership;
  });
}