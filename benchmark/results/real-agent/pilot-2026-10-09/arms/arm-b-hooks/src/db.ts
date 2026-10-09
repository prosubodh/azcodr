/**
 * In-memory data store with a minimal transactional layer.
 *
 * `db.withTransaction(fn)` stages every write performed through the transaction
 * and only applies the staged operations to the store when `fn` returns without
 * throwing — giving all-or-nothing ("atomic") semantics, which T06 relies on to
 * persist outbox events in the same transaction as the domain change.
 */
import { randomUUID } from "node:crypto";

export type Row = { id: string };

const STORE = new Map<string, Map<string, Row>>();

function collection<T extends Row>(name: string): Map<string, T> {
  let col = STORE.get(name);
  if (!col) {
    col = new Map();
    STORE.set(name, col);
  }
  return col as Map<string, T>;
}

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export type StagedOp =
  | { kind: "insert"; collection: string; row: Row }
  | { kind: "update"; collection: string; id: string; patch: Partial<Row> }
  | { kind: "delete"; collection: string; id: string };

export interface Tx {
  insert<T extends Row>(name: string, row: T): void;
  update<T extends Row>(name: string, id: string, patch: Partial<T>): void;
  remove(name: string, id: string): void;
  find(name: string, id: string): Row | undefined;
  findAll(name: string): Row[];
}

export const db = {
  reset(): void {
    STORE.clear();
  },

  insert<T extends Row>(name: string, row: T): T {
    const copy = { ...row } as Row;
    collection(name).set(row.id, copy);
    return copy as T;
  },

  update<T extends Row>(name: string, id: string, patch: Partial<T>): T | undefined {
    const col = collection(name);
    const row = col.get(id);
    if (!row) return undefined;
    const updated = { ...row, ...patch } as T;
    col.set(id, updated as unknown as Row);
    return updated;
  },

  remove(name: string, id: string): boolean {
    return collection(name).delete(id);
  },

  find<T extends Row>(name: string, id: string): T | undefined {
    return collection(name).get(id) as T | undefined;
  },

  findAll<T extends Row>(name: string): T[] {
    return [...collection(name).values()] as T[];
  },

  findBy<T extends Row>(name: string, predicate: (row: T) => boolean): T[] {
    return (collection(name).values() as unknown as T[]).filter(predicate);
  },

  findOne<T extends Row>(name: string, predicate: (row: T) => boolean): T | undefined {
    return [...collection(name).values()].find((r) => predicate(r as T)) as T | undefined;
  },

  count(name: string): number {
    return collection(name).size;
  },

  /**
   * Runs `fn` inside a transaction. Writes performed through `tx` are staged and
   * applied to the store only if `fn` completes without throwing.
   */
  withTransaction<T>(fn: (tx: Tx) => T): T {
    const ops: StagedOp[] = [];
    const tx: Tx = {
      insert(name, row) {
        ops.push({ kind: "insert", collection: name, row: { ...row } as Row });
      },
      update<T extends Row>(name: string, id: string, patch: Partial<T>): void {
        const current = collection(name).get(id);
        if (!current) return;
        ops.push({ kind: "update", collection: name, id, patch: { ...patch } as Partial<Row> });
      },
      remove(name, id) {
        ops.push({ kind: "delete", collection: name, id });
      },
      find(name, id) {
        return collection(name).get(id) as Row | undefined;
      },
      findAll(name) {
        return [...collection(name).values()] as Row[];
      },
    };

    const result = fn(tx); // throws -> nothing is committed (atomic rollback)
    applyOps(ops);
    return result;
  },
};

function applyOps(ops: StagedOp[]): void {
  for (const op of ops) {
    if (op.kind === "insert") {
      collection(op.collection).set(op.row.id, op.row);
    } else if (op.kind === "update") {
      const col = collection(op.collection);
      const row = col.get(op.id);
      if (row) col.set(op.id, { ...row, ...op.patch });
    } else {
      collection(op.collection).delete(op.id);
    }
  }
}

export function resetDb(): void {
  db.reset();
}