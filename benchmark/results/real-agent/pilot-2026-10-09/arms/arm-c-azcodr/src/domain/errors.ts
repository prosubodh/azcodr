/**
 * Canonical DomainError hierarchy (docs/rules/error_handling.md).
 * Each subclass maps to a canonical HTTP status via `status`.
 */
export class DomainError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.status = status;
  }
}

/** Maps to HTTP 422. */
export class ValidationError extends DomainError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, code, 422);
  }
}

/** Maps to HTTP 401. */
export class UnauthorizedError extends DomainError {
  constructor(message: string, code = 'UNAUTHORIZED') {
    super(message, code, 401);
  }
}

/** Maps to HTTP 403. */
export class ForbiddenError extends DomainError {
  constructor(message: string, code = 'FORBIDDEN') {
    super(message, code, 403);
  }
}

/** Maps to HTTP 404. */
export class NotFoundError extends DomainError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, code, 404);
  }
}

/** Maps to HTTP 409. */
export class ConflictError extends DomainError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code, 409);
  }
}