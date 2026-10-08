/**
 * Secondary Outgoing Adapter: InMemoryTodoRepository
 *
 * Implements TodoRepositoryPort for testing and ephemeral execution.
 */
export class InMemoryTodoRepository {
  constructor() {
    this.store = new Map();
  }

  /**
   * @param {import('../domain/ports.js').Todo} todo
   */
  async save(todo) {
    this.store.set(todo.id, { ...todo });
  }

  /**
   * @param {string} id
   */
  async findById(id) {
    const item = this.store.get(id);
    return item ? { ...item } : null;
  }

  async findAll() {
    return Array.from(this.store.values()).map((t) => ({ ...t }));
  }

  /**
   * @param {string} id
   */
  async delete(id) {
    return this.store.delete(id);
  }
}
