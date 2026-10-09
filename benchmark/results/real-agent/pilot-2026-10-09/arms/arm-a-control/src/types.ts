// Shared request/response shapes used by every handler "endpoint".
// This is a neutral types module - no implementation, no dependencies.

export interface HttpRequest {
  method: string;
  /** Raw path, including any query string, e.g. "/api/workspaces/w1/audit?limit=2" */
  path: string;
  /** Parsed JSON body (if any). May also be a raw string for signed payloads. */
  body: unknown;
  /** Header keys are lower-cased, e.g. "stripe-signature". */
  headers: Record<string, string | undefined>;
}

export interface HttpResponse {
  status: number;
  body: unknown;
}

export function ok(body: unknown, status = 200): HttpResponse {
  return { status, body };
}

export function fail(status: number, message: string, extra?: Record<string, unknown>): HttpResponse {
  return { status, body: { error: message, ...(extra ?? {}) } };
}

/** Parse a query string off the raw path. */
export function queryParams(path: string): URLSearchParams {
  return new URL(path, "http://localhost").searchParams;
}