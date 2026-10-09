/**
 * Shared request/response contract for every modeled "endpoint".
 *
 * Every endpoint is an exported async handler taking a `{ method, path, body, headers }`
 * request and returning a `{ status, body }` response.
 */

export interface HttpRequest {
  method: string;
  path: string; // may include a query string, e.g. /api/audit?workspaceId=w1&cursor=...
  body?: unknown;
  headers?: Record<string, string | string[] | undefined>;
  /** Raw request body as received on the wire (used by signature-verified webhooks). */
  rawBody?: string;
}

export interface HttpResponse {
  status: number;
  body: unknown;
}

export type HttpHeaders = Record<string, string | string[] | undefined>;

export type Handler = (req: HttpRequest) => Promise<HttpResponse>;

/** Membership roles, ordered Owner > Admin > Member > Viewer (see rbac.ts). */
export type Role = "Owner" | "Admin" | "Member" | "Viewer";

/** Error carrying an HTTP status; `respond()` turns it into a response body. */
export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

/** Runs a handler body, converting HttpError -> JSON error response, anything else -> 500. */
export async function respond(fn: () => HttpResponse | Promise<HttpResponse>): Promise<HttpResponse> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return { status: err.status, body: { error: err.message } };
    }
    return { status: 500, body: { error: "internal server error" } };
  }
}

export function splitQuery(path: string): { pathname: string; query: URLSearchParams } {
  const url = new URL(path, "http://localhost");
  return { pathname: url.pathname, query: url.searchParams };
}

export function pathSegments(path: string): string[] {
  return splitQuery(path).pathname.split("/").filter(Boolean);
}

export function queryParam(path: string, name: string): string | null {
  return splitQuery(path).query.get(name);
}