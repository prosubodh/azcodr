import type { HttpRequest, HttpResponse } from "./types.ts";
import { fail } from "./types.ts";
import { register, login, oauthCallback } from "./auth.ts";
import { createWorkspace, listWorkspaces, getWorkspace } from "./tenant.ts";
import { inviteMember, listMembers, removeMember } from "./rbac.ts";
import { listFeatureStates, upgradeSubscription } from "./billing.ts";
import { listAuditLogs } from "./audit.ts";
import { handleStripeWebhook } from "./payments.ts";
import { processOutbox } from "./outbox.ts";

// ---------------------------------------------------------------------------
// Tiny routing layer: maps method+path patterns to exported handler functions.
// Handlers also parse their own params from req.path, so calling them directly
// in acceptance tests works without going through this table.
// ---------------------------------------------------------------------------

export type Handler = (req: HttpRequest) => HttpResponse | Promise<HttpResponse>;

interface Route {
  method: string;
  pattern: string;
  handler: Handler;
}

const routes: Route[] = [
  // auth (T01, T02, T03)
  { method: "POST", pattern: "/api/auth/register", handler: register },
  { method: "POST", pattern: "/api/auth/login", handler: login },
  { method: "POST", pattern: "/api/auth/oauth/:provider/callback", handler: oauthCallback },
  // workspaces / tenancy (T04)
  { method: "GET", pattern: "/api/workspaces", handler: listWorkspaces },
  { method: "POST", pattern: "/api/workspaces", handler: createWorkspace },
  { method: "GET", pattern: "/api/workspaces/:id", handler: getWorkspace },
  // members / RBAC (T09)
  { method: "GET", pattern: "/api/workspaces/:id/members", handler: listMembers },
  { method: "POST", pattern: "/api/workspaces/:id/members", handler: inviteMember },
  { method: "DELETE", pattern: "/api/workspaces/:id/members/:userId", handler: removeMember },
  // billing (T05)
  { method: "GET", pattern: "/api/workspaces/:id/features", handler: listFeatureStates },
  { method: "POST", pattern: "/api/workspaces/:id/billing/upgrade", handler: upgradeSubscription },
  // audit (T08)
  { method: "GET", pattern: "/api/workspaces/:id/audit", handler: listAuditLogs },
  // payments (T07)
  { method: "POST", pattern: "/api/webhooks/stripe", handler: handleStripeWebhook },
  // outbox worker (T06)
  { method: "POST", pattern: "/api/outbox/process", handler: processOutbox },
];

/**
 * Match a path (with or without query string) against a pattern where segments
 * like ":name" capture a single path segment. Returns captured params or null.
 */
export function matchPath(pattern: string, path: string): Record<string, string> | null {
  const cleanPath = path.split("?")[0];
  const patternSegs = pattern.split("/").filter(Boolean);
  const pathSegs = cleanPath.split("/").filter(Boolean);
  if (patternSegs.length !== pathSegs.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternSegs.length; i += 1) {
    const p = patternSegs[i];
    const s = pathSegs[i];
    if (p.startsWith(":")) {
      params[p.slice(1)] = decodeURIComponent(s);
    } else if (p !== s) {
      return null;
    }
  }
  return params;
}

export async function dispatch(request: HttpRequest): Promise<HttpResponse> {
  const method = request.method.toUpperCase();
  const path = request.path.split("?")[0];
  for (const route of routes) {
    if (route.method === method && matchPath(route.pattern, path) !== null) {
      return route.handler(request);
    }
  }
  return fail(404, `no route for ${method} ${path}`);
}

export { routes };