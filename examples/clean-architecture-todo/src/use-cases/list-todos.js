/**
 * Application Use Case: ListTodos
 *
 * Queries all todos through the domain repository port.
 */
export class ListTodosUseCase {
  /**
   * @param {import('../domain/ports.js').TodoRepositoryPort} repo
   */
  constructor(repo) {
    this.repo = repo;
  }

  async execute() {
    return this.repo.findAll();
  }
}
