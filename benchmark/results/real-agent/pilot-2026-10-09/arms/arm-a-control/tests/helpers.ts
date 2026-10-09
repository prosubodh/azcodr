import { request as httpRequest } from "node:http";
import { db } from "../src/db.ts";
import type { HttpRequest, HttpResponse } from "../src/types.ts";
import { register, login } from "../src/auth.ts";
import { createWorkspace } from "../src/tenant.ts";

/** Build a handler request object. */
export function req(
  method: string,
  path: string,
  body: unknown = undefined,
  headers: Record<string, string | undefined> = {},
): HttpRequest {
  return { method, path, body, headers };
}

export function bearer(token: string): Record<string, string | undefined> {
  return { authorization: `Bearer ${token}` };
}

export function expectStatus(response: HttpResponse, status: number): void {
  if (response.status !== status) {
    throw new Error(
      `expected status ${status} but got ${response.status}: ${JSON.stringify(response.body)}`,
    );
  }
}

export function expectOk(response: HttpResponse): Record<string, any> {
  if (response.status < 200 || response.status >= 300) {
    throw new Error(`expected 2xx but got ${response.status}: ${JSON.stringify(response.body)}`);
  }
  return response.body as Record<string, any>;
}

export function resetDb(): void {
  db.reset();
}

export interface RegisteredUser {
  id: string;
  email: string;
  token: string;
}

/** Register a fresh user and log them in, returning id + access token. */
export function registerAndLogin(email: string, password = "password-123"): RegisteredUser {
  const reg = register(req("POST", "/api/auth/register", { email, password }));
  expectStatus(reg, 201);
  const userId = (reg.body as { user: { id: string } }).user.id;

  const log = login(req("POST", "/api/auth/login", { email, password }));
  expectStatus(log, 200);
  const token = (log.body as { token: string }).token;
  return { id: userId, email, token };
}

export interface CreatedWorkspace {
  id: string;
  role: string;
}

/** Register/login a user and create a workspace as them. */
export function userWithWorkspace(
  email: string,
  password = "password-123",
): { user: RegisteredUser; workspaceId: string } {
  const user = registerAndLogin(email, password);
  const res = createWorkspace(req("POST", "/api/workspaces", { name: "Test Workspace" }, bearer(user.token)));
  expectStatus(res, 201);
  const workspaceId = (res.body as { workspace: { id: string } }).workspace.id;
  return { user, workspaceId };
}

/** Minimal JSON HTTP client over node:http with per-request connections. */
export function httpJson(
  method: string,
  url: string,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const payload = body === undefined ? null : JSON.stringify(body);
    const httpHeaders: Record<string, string> = {
      ...headers,
      ...(payload ? { "content-type": "application/json" } : {}),
    };
    const clientReq = httpRequest(
      {
        hostname: parsed.hostname,
        port: parsed.port,
        path: parsed.pathname + parsed.search,
        method,
        headers: httpHeaders,
        agent: false, // no pooling: every request closes its socket
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (chunk: Buffer) => chunks.push(chunk));
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8");
          let parsedBody: unknown = null;
          if (raw.length > 0) {
            try {
              parsedBody = JSON.parse(raw);
            } catch {
              parsedBody = raw;
            }
          }
          resolve({ status: res.statusCode ?? 0, body: parsedBody });
        });
      },
    );
    clientReq.on("error", reject);
    if (payload) clientReq.write(payload);
    clientReq.end();
  });
}