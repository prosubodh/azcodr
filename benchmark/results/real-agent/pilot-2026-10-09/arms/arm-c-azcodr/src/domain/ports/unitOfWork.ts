/**
 * Transaction boundary port: aggregate mutations and their outbox events must
 * commit or roll back together (ACID). Adapters map this to a real database
 * transaction or an in-memory snapshot for tests.
 */
export interface UnitOfWorkPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}