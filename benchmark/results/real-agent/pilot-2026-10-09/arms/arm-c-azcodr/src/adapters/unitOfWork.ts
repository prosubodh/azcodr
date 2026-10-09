import type { MemoryStore } from './memoryStore.ts';
import type { UnitOfWorkPort } from '../domain/ports/unitOfWork.ts';

/**
 * In-memory transaction adapter: snapshots every collection, applies the work,
 * and rolls back the snapshots if it throws. Mirrors a DB transaction for
 * tests/dev; production swaps in a real transactional runner.
 */
export function createUnitOfWork(store: MemoryStore): UnitOfWorkPort {
  return {
    async run<T>(work: () => Promise<T>): Promise<T> {
      const snapshot: Array<[unknown[], unknown[]]> = [
        [store.users, [...store.users]],
        [store.oauthAccounts, [...store.oauthAccounts]],
        [store.workspaces, [...store.workspaces]],
        [store.memberships, [...store.memberships]],
        [store.subscriptions, [...store.subscriptions]],
        [store.outbox, [...store.outbox]],
        [store.audit, [...store.audit]]
      ];
      try {
        return await work();
      } catch (error) {
        for (const [target, copy] of snapshot) {
          (target as unknown[]).length = 0;
          (target as unknown[]).push(...(copy as unknown[]));
        }
        throw error;
      }
    }
  };
}