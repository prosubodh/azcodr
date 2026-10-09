import type { User } from '../domain/user.ts';
import type { Membership, Workspace } from '../domain/workspace.ts';
import type { OutboxEntry } from '../domain/outbox.ts';
import type { AuditEntry } from '../domain/audit.ts';
import type { Subscription } from '../domain/plans.ts';
import type {
  AuditRepositoryPort,
  MembershipRepositoryPort,
  OAuthAccount,
  OAuthAccountRepositoryPort,
  OutboxRepositoryPort,
  SubscriptionRepositoryPort,
  UserRepositoryPort,
  WorkspaceRepositoryPort
} from '../domain/ports/repositories.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { ConflictError } from '../domain/errors.ts';

/**
 * In-memory persistence adapter (test seam / dev mode). Implements the domain
 * repository ports; a production deployment would swap in a real database
 * adapter without touching domain or application layers.
 */
export interface MemoryStore {
  readonly users: User[];
  readonly oauthAccounts: OAuthAccount[];
  readonly workspaces: Workspace[];
  readonly memberships: Membership[];
  readonly subscriptions: Subscription[];
  readonly outbox: OutboxEntry[];
  readonly audit: AuditEntry[];
  readonly userRepository: UserRepositoryPort;
  readonly oauthAccountRepository: OAuthAccountRepositoryPort;
  readonly workspaceRepository: WorkspaceRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly subscriptionRepository: SubscriptionRepositoryPort;
  readonly outboxRepository: OutboxRepositoryPort;
  readonly auditRepository: AuditRepositoryPort;
}

export function createInMemoryStore(): MemoryStore {
  const users: User[] = [];
  const oauthAccounts: OAuthAccount[] = [];
  const workspaces: Workspace[] = [];
  const memberships: Membership[] = [];
  const subscriptions: Subscription[] = [];
  const outbox: OutboxEntry[] = [];
  const audit: AuditEntry[] = [];

  const userRepository: UserRepositoryPort = {
    async findByEmail(email) {
      return users.find((u) => u.email === email) ?? null;
    },
    async create(user) {
      if (users.some((u) => u.email === user.email)) {
        throw new ConflictError('An account with this email already exists.', 'EMAIL_TAKEN');
      }
      users.push({ ...user });
    }
  };

  const oauthAccountRepository: OAuthAccountRepositoryPort = {
    async findByProviderSubject(provider, providerUserId) {
      return oauthAccounts.find(
        (a) => a.provider === provider && a.providerUserId === providerUserId
      ) ?? null;
    },
    async create(account) {
      if (oauthAccounts.some((a) => a.provider === account.provider && a.providerUserId === account.providerUserId)) {
        throw new ConflictError('This provider identity is already linked.', 'OAUTH_ACCOUNT_EXISTS');
      }
      oauthAccounts.push({ ...account });
    }
  };

  const workspaceRepository: WorkspaceRepositoryPort = {
    async create(workspace) {
      workspaces.push({ ...workspace });
    },
    async findById(workspaceId) {
      return workspaces.find((w) => w.id === workspaceId) ?? null;
    }
  };

  const membershipRepository: MembershipRepositoryPort = {
    async create(membership) {
      memberships.push({ ...membership });
    },
    async findByUserAndWorkspace(userId, workspaceId) {
      return memberships.find((m) => m.userId === userId && m.workspaceId === workspaceId) ?? null;
    },
    async listByWorkspace(workspaceId) {
      return memberships.filter((m) => m.workspaceId === workspaceId);
    },
    async listByUser(userId) {
      return memberships.filter((m) => m.userId === userId);
    }
  };

  const subscriptionRepository: SubscriptionRepositoryPort = {
    async findByWorkspaceId(workspaceId) {
      return subscriptions.find((s) => s.workspaceId === workspaceId) ?? null;
    },
    async findByStripeSubscriptionId(stripeSubscriptionId) {
      return subscriptions.find((s) => s.stripeSubscriptionId === stripeSubscriptionId) ?? null;
    },
    async upsert(subscription) {
      const index = subscriptions.findIndex((s) => s.id === subscription.id);
      if (index === -1) {
        subscriptions.push({ ...subscription });
      } else {
        subscriptions[index] = { ...subscription };
      }
    }
  };

  const outboxRepository: OutboxRepositoryPort = {
    async stage(entry) {
      outbox.push({ ...entry, payload: { ...entry.payload } });
    },
    async listPending(limit) {
      return outbox.filter((e) => e.status === 'PENDING').slice(0, limit);
    },
    async markSent(id, deliveredAt) {
      const index = outbox.findIndex((e) => e.id === id);
      if (index !== -1) {
        const entry = outbox[index];
        if (entry !== undefined) {
          outbox[index] = { ...entry, status: 'SENT', deliveredAt };
        }
      }
    }
  };

  const auditRepository: AuditRepositoryPort = {
    async append(entry) {
      audit.push({ ...entry, details: { ...entry.details } });
    },
    async listByWorkspace(workspaceId, after, limit) {
      const sorted = audit
        .filter((e) => e.workspaceId === workspaceId)
        .sort((a, b) => {
          const byTime = b.occurredAt.localeCompare(a.occurredAt);
          return byTime !== 0 ? byTime : b.id.localeCompare(a.id);
        });
      const candidates = after === null
        ? sorted
        : sorted.filter(
            (e) => e.occurredAt < after.occurredAt || (e.occurredAt === after.occurredAt && e.id < after.id)
          );
      const page = candidates.slice(0, limit + 1);
      return { records: page.slice(0, limit), more: page.length > limit };
    }
  };

  return {
    users,
    oauthAccounts,
    workspaces,
    memberships,
    subscriptions,
    outbox,
    audit,
    userRepository,
    oauthAccountRepository,
    workspaceRepository,
    membershipRepository,
    subscriptionRepository,
    outboxRepository,
    auditRepository
  };
}