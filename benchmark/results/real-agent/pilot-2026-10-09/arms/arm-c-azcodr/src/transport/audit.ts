import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import { requireUser } from './authGuard.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import type { AuditRepositoryPort, MembershipRepositoryPort } from '../domain/ports/repositories.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { listAuditForWorkspace, type AuditDeps } from '../application/audit.ts';

export interface AuditHandlersDeps {
  readonly auditRepository: AuditRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly tokenSigner: TokenSignerPort;
}

export interface AuditHandlers {
  readonly listAudit: HttpHandler;
}

/** /v1/workspaces/:workspaceId/audit[?cursor=...&limit=...] */
function parseAuditPath(path: string): { workspaceId: WorkspaceId | null; cursor?: string; limit?: number } {
  const [pathOnly = '', query = ''] = path.split('?');
  const segments = pathOnly.split('/').filter((s) => s.length > 0);
  if (segments.length !== 4 || segments[0] !== 'v1' || segments[1] !== 'workspaces' || segments[3] !== 'audit') {
    return { workspaceId: null };
  }
  const params = new URLSearchParams(query);
  const rawLimit = params.get('limit');
  return {
    workspaceId: segments[2] as WorkspaceId,
    cursor: params.get('cursor') ?? undefined,
    limit: rawLimit === null ? undefined : Number(rawLimit)
  };
}

export function createAuditHandlers(deps: AuditHandlersDeps): AuditHandlers {
  const appDeps: AuditDeps = {
    auditRepository: deps.auditRepository,
    membershipRepository: deps.membershipRepository
  };
  return {
    listAudit: async (req) => {
      try {
        const claims = await requireUser(deps, req.headers);
        const parsed = parseAuditPath(req.path);
        if (parsed.workspaceId === null) {
          return { status: 404, body: { code: 'NOT_FOUND', detail: 'Unknown endpoint.' } };
        }
        const page = await listAuditForWorkspace(appDeps, {
          workspaceId: parsed.workspaceId,
          actorUserId: claims.sub as UserId,
          cursor: parsed.cursor,
          limit: parsed.limit
        });
        return { status: 200, body: page };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}