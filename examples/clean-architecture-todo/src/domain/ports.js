/**
 * Core Domain Ports: Secondary & Driving Port Contracts
 *
 * Defines persistence and timing interfaces owned by the core domain.
 */

/**
 * @typedef {Object} Todo
 * @property {string} id
 * @property {string} title
 * @property {boolean} completed
 * @property {number} createdAt
 */

/**
 * @typedef {Object} TodoRepositoryPort
 * @property {(todo: Todo) => Promise<void>} save
 * @property {(id: string) => Promise<Todo | null>} findById
 * @property {() => Promise<readonly Todo[]>} findAll
 * @property {(id: string) => Promise<boolean>} delete
 */

/**
 * @typedef {Object} ClockPort
 * @property {() => number} now
 */
export const PORT_MARKER = 'ports';
