import type { MembershipId, UserId, WorkspaceId } from './ids.ts';
import { newId } from './ids.ts';
import { ValidationError } from './errors.ts';

/** Organization workspace (Tenancy bounded context). */
export interface Workspace {
  readonly id: WorkspaceId;
  readonly name: string;
  readonly createdBy: UserId;
  readonly createdAt: string;
}

export type MemberRole = 'Owner' | 'Admin' | 'Member' | 'Viewer';

/** Membership links a user to a workspace with an authoritative role. */
export interface Membership {
  readonly id: MembershipId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: MemberRole;
  readonly createdAt: string;
}

export interface NewWorkspace {
  readonly name: string;
  readonly createdBy: UserId;
}

/**
 * Aggregate factory: a workspace and its founding Owner membership are born
 * together, atomically (invariant: the creator is the workspace Owner).
 */
export function createWorkspace(input: NewWorkspace): { workspace: Workspace; membership: Membership } {
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    throw new ValidationError('A workspace name is required.', 'INVALID_WORKSPACE_NAME');
  }
  const now = new Date().toISOString();
  const workspace: Workspace = {
    id: newId('ws') as WorkspaceId,
    name: input.name.trim(),
    createdBy: input.createdBy,
    createdAt: now
  };
  const membership: Membership = {
    id: newId('mem') as MembershipId,
    workspaceId: workspace.id,
    userId: input.createdBy,
    role: 'Owner',
    createdAt: now
  };
  return { workspace, membership };
}

export interface NewMembership {
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: MemberRole;
}

/**
 * Membership factory for invites. Invariants are enforced by the caller
 * (roles module + application layer); the founder path uses createWorkspace.
 */
export function createMembership(input: NewMembership): Membership {
  return {
    id: newId('mem') as MembershipId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    role: input.role,
    createdAt: new Date().toISOString()
  };
}