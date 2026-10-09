import type { MemberRole } from './workspace.ts';

export const ALL_MEMBER_ROLES: readonly MemberRole[] = ['Owner', 'Admin', 'Member', 'Viewer'];

const ROLE_RANK: Readonly<Record<MemberRole, number>> = { Owner: 4, Admin: 3, Member: 2, Viewer: 1 };

export function isMemberRole(value: string): value is MemberRole {
  return (ALL_MEMBER_ROLES as readonly string[]).includes(value);
}

/**
 * Invitation governance (docs/rules/authorization.md): only Owners and Admins
 * may invite, and only into a role strictly below their own — so a Viewer can
 * never invite, and nobody can invite peers or superiors.
 */
export function canInviteRole(actorRole: MemberRole, targetRole: MemberRole): boolean {
  if (actorRole !== 'Owner' && actorRole !== 'Admin') return false;
  return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}