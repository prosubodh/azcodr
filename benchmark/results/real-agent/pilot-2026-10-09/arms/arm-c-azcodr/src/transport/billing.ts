import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import { requireUser } from './authGuard.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import type { MembershipRepositoryPort, SubscriptionRepositoryPort } from '../domain/ports/repositories.ts';
import type { UserId, WorkspaceId } from '../domain/ids.ts';
import { checkFeatureAccess, type BillingDeps } from '../application/billing.ts';

export interface BillingHandlersDeps {
  readonly subscriptionRepository: SubscriptionRepositoryPort;
  readonly membershipRepository: MembershipRepositoryPort;
  readonly tokenSigner: TokenSignerPort;
}

export interface BillingHandlers {
  readonly checkFeature: HttpHandler;
}

/** /v1/workspaces/:workspaceId/features/:feature */
function parseFeaturePath(path: string): { workspaceId: string; feature: string } | null {
  const segments = path.split('/').filter((s) => s.length > 0);
  if (segments.length !== 5) return null;
  if (segments[0] !== 'v1' || segments[1] !== 'workspaces' || segments[3] !== 'features') return null;
  return { workspaceId: segments[2] ?? '', feature: segments[4] ?? '' };
}

export function createBillingHandlers(deps: BillingHandlersDeps): BillingHandlers {
  const appDeps: BillingDeps = {
    subscriptionRepository: deps.subscriptionRepository,
    membershipRepository: deps.membershipRepository
  };
  return {
    checkFeature: async (req) => {
      try {
        const claims = await requireUser(deps, req.headers);
        const parsed = parseFeaturePath(req.path);
        if (parsed === null) {
          return { status: 404, body: { code: 'NOT_FOUND', detail: 'Unknown endpoint.' } };
        }
        const result = await checkFeatureAccess(appDeps, {
          workspaceId: parsed.workspaceId as WorkspaceId,
          actorUserId: claims.sub as UserId,
          feature: parsed.feature
        });
        return { status: 200, body: result };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}