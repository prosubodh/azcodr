import { randomUUID } from "node:crypto";
import type { BillingTier } from "./config.ts";

// ---------------------------------------------------------------------------
// In-memory data store. Rows are treated as immutable: updates replace the
// row object via db.x.set(id, { ...old, ...patch }). This keeps transaction
// snapshots safe (the snapshot maps capture the pre-transaction row objects).
// ---------------------------------------------------------------------------

export type ID = string;

export type Role = "Owner" | "Admin" | "Member" | "Viewer";
export const ROLES: readonly Role[] = ["Owner", "Admin", "Member", "Viewer"];

export interface UserRow {
  id: ID;
  email: string;
  passwordHash: string | null;
  oauthProvider: string | null;
  oauthSubject: string | null;
  createdAt: number;
}

export interface WorkspaceRow {
  id: ID;
  name: string;
  ownerId: ID;
  createdAt: number;
}

export interface MembershipRow {
  id: ID;
  workspaceId: ID;
  userId: ID;
  role: Role;
  createdAt: number;
}

export type SubscriptionStatus = "active" | "inactive" | "past_due" | "unpaid" | "canceled";

export interface SubscriptionRow {
  workspaceId: ID;
  tier: BillingTier;
  status: SubscriptionStatus;
  stripeCustomerId: string | null;
  updatedAt: number;
}

export type OutboxStatus = "pending" | "sent";

export interface OutboxRow {
  id: ID;
  type: string;
  aggregateId: ID;
  payload: string; // JSON-encoded details
  status: OutboxStatus;
  createdAt: number;
  deliveredAt: number | null;
}

export interface AuditRow {
  id: ID;
  workspaceId: ID;
  actorId: ID;
  action: string;
  details: string;
  createdAt: number;
}

interface DatabaseSnapshot {
  users: Map<ID, UserRow>;
  workspaces: Map<ID, WorkspaceRow>;
  memberships: Map<ID, MembershipRow>;
  subscriptions: Map<ID, SubscriptionRow>;
  outbox: Map<ID, OutboxRow>;
  audits: Map<ID, AuditRow>;
}

class Database {
  users = new Map<ID, UserRow>();
  workspaces = new Map<ID, WorkspaceRow>();
  memberships = new Map<ID, MembershipRow>();
  subscriptions = new Map<ID, SubscriptionRow>();
  outbox = new Map<ID, OutboxRow>();
  audits = new Map<ID, AuditRow>();

  reset(): void {
    this.users.clear();
    this.workspaces.clear();
    this.memberships.clear();
    this.subscriptions.clear();
    this.outbox.clear();
    this.audits.clear();
  }

  /** Run fn atomically: on throw, every write performed inside is rolled back. */
  transaction<T>(fn: () => T): T {
    const snapshot = this.snapshot();
    try {
      return fn();
    } catch (err) {
      this.restore(snapshot);
      throw err;
    }
  }

  private snapshot(): DatabaseSnapshot {
    return {
      users: new Map(this.users),
      workspaces: new Map(this.workspaces),
      memberships: new Map(this.memberships),
      subscriptions: new Map(this.subscriptions),
      outbox: new Map(this.outbox),
      audits: new Map(this.audits),
    };
  }

  private restore(snapshot: DatabaseSnapshot): void {
    this.users = snapshot.users;
    this.workspaces = snapshot.workspaces;
    this.memberships = snapshot.memberships;
    this.subscriptions = snapshot.subscriptions;
    this.outbox = snapshot.outbox;
    this.audits = snapshot.audits;
  }
}

export const db = new Database();

export function newId(): ID {
  return randomUUID();
}

export function rowOf<T extends { id: ID }>(map: Map<ID, T>, id: ID): T | undefined {
  return map.get(id);
}

/** Find a user by normalized email. */
export function userByEmail(email: string): UserRow | undefined {
  const normalized = email.trim().toLowerCase();
  for (const user of db.users.values()) {
    if (user.email === normalized) return user;
  }
  return undefined;
}