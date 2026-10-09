import type { HttpResponse } from './endpoint.ts';
import { DomainError } from '../domain/errors.ts';

/**
 * Standardized RFC 9457 problem-details envelope (docs/rules/error_handling.md).
 * Maps the canonical DomainError hierarchy to wire-safe responses without
 * leaking stacks or SQL.
 */
export function toProblem(error: unknown): HttpResponse {
  if (error instanceof DomainError) {
    return {
      status: error.status,
      body: {
        type: `https://api.local/errors/${error.code}`,
        title: error.name,
        status: error.status,
        detail: error.message,
        code: error.code
      }
    };
  }
  return {
    status: 500,
    body: {
      type: 'https://api.local/errors/INTERNAL',
      title: 'Internal Server Error',
      status: 500,
      detail: 'An unexpected error occurred.',
      code: 'INTERNAL'
    }
  };
}