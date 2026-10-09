import type { User } from '../user.ts';
import type { OAuthProviderName } from './oauth.ts';
import type { Membership, Workspace } from '../workspace.ts';
import type { MembershipId, UserId, WorkspaceId } from '../ids.ts';
import type { OutboxEntry } from '../outbox.ts';
import type { AuditEntry } from '../audit.ts';
import type { Subscription } from '../plans.ts';

/**
 * Persistence port for the User aggregate. Adapters (infrastructure) implement
 * this; domain and application depend only on the interface.
 */
export interface UserRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<void>;
}

/** Identity link between an external provider subject and a local User. */
export interface OAuthAccount {
  readonly id: string;
  readonly provider: OAuthProviderName;
  readonly providerUserId: string;
  readonly userId: User['id'];
  readonly email: string;
  readonly createdAt: string;
}

export interface OAuthAccountRepositoryPort {
  findByProviderSubject(provider: OAuthProviderName, providerUserId: string): Promise<OAuthAccount | null>;
  create(account: OAuthAccount): Promise<void>;
}

/**
 * Tenancy ports. All queries stay partitioned by workspace id: callers never
 * enumerate across tenants (docs/rules/multitenancy_architecture.md).
 */
export interface WorkspaceRepositoryPort {
  create(workspace: Workspace): Promise<void>;
  findById(workspaceId: WorkspaceId): Promise<Workspace | null>;
}

export interface MembershipRepositoryPort {
  create(membership: Membership): Promise<void>;
  findByUserAndWorkspace(userId: UserId, workspaceId: WorkspaceId): Promise<Membership | null>;
  listByWorkspace(workspaceId: WorkspaceId): Promise<Membership[]>;
  listByUser(userId: UserId): Promise<Membership[]>;
}

/** Billing port: subscription reads/writes are tunneled through the domain. */
export interface SubscriptionRepositoryPort {
  findByWorkspaceId(workspaceId: WorkspaceId): Promise<Subscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
  upsert(subscription: Subscription): Promise<void>;
}

/** Outbox port: events staged with their aggregate, drained later at-least-once. */
export interface OutboxRepositoryPort {
  stage(entry: OutboxEntry): Promise<void>;
  listPending(limit: number): Promise<OutboxEntry[]>;
  markSent(id: string, deliveredAt: string): Promise<void>;
}

/** Opaque pagination position: the exclusive boundary record of the last page. */
export interface AuditCursor {
  readonly occurredAt: string;
  readonly id: string;
}

/** Audit trail port: append-only tenant log with strictly-after cursor pagination. */
export interface AuditRepositoryPort {
  append(entry: AuditEntry): Promise<void>;
  listByWorkspace(
    workspaceId: WorkspaceId,
    after: AuditCursor | null,
    limit: number
  ): Promise<{ records: AuditEntry[]; more: boolean }>;
}