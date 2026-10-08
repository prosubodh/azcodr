/**
 * Application Use Case: CreateTodo
 *
 * Orchestrates domain creation and persistence via secondary repository port.
 */
import { createTodo } from '../domain/todo.js';

export class CreateTodoUseCase {
  /**
   * @param {import('../domain/ports.js').TodoRepositoryPort} repo
   * @param {import('../domain/ports.js').ClockPort} clock
   */
  constructor(repo, clock) {
    this.repo = repo;
    this.clock = clock;
  }

  /**
   * @param {{ id: string, title: string }} request
   */
  async execute(request) {
    const todo = createTodo({
      id: request.id,
      title: request.title,
      now: this.clock.now()
    });
    await this.repo.save(todo);
    return todo;
  }
}
