/** Canonical endpoint contract: every endpoint is an exported async handler. */

export interface HttpRequest {
  readonly method: string;
  readonly path: string;
  readonly body?: unknown;
  readonly headers: Record<string, string | string[] | undefined>;
}

export interface HttpResponse {
  readonly status: number;
  readonly body?: unknown;
}

export type HttpHandler = (req: HttpRequest) => Promise<HttpResponse>;