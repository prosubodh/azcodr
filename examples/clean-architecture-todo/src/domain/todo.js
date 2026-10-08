/**
 * Core Domain Entity: Todo
 *
 * Invariants:
 * - Title must be non-empty string and maximum 100 characters.
 * - Completed status defaults to false.
 * - Zero external framework or infrastructure dependencies.
 */

/**
 * @param {string} title
 * @returns {string}
 */
export function validateTitle(title) {
  const trimmed = typeof title === 'string' ? title.trim() : '';
  if (!trimmed) {
    throw new Error('Todo title cannot be empty');
  }
  if (trimmed.length > 100) {
    throw new Error('Todo title cannot exceed 100 characters');
  }
  return trimmed;
}

/**
 * @param {{ id: string, title: string, now?: number }} input
 */
export function createTodo(input) {
  const validatedTitle = validateTitle(input.title);
  return {
    id: input.id,
    title: validatedTitle,
    completed: false,
    createdAt: input.now ?? Date.now()
  };
}

/**
 * @param {{ id: string, title: string, completed: boolean, createdAt: number }} todo
 */
export function toggleTodo(todo) {
  return {
    ...todo,
    completed: !todo.completed
  };
}
