import type { HttpHandler } from './endpoint.ts';
import { toProblem } from './errors.ts';
import type { PasswordHasherPort } from '../domain/ports/crypto.ts';
import type { UserRepositoryPort } from '../domain/ports/repositories.ts';
import type { TokenSignerPort } from '../domain/ports/tokens.ts';
import { registerUser } from '../application/registerUser.ts';
import { loginUser } from '../application/loginUser.ts';

export interface AuthHandlersDeps {
  readonly userRepository: UserRepositoryPort;
  readonly passwordHasher: PasswordHasherPort;
  readonly tokenSigner: TokenSignerPort;
}

export interface AuthHandlers {
  readonly register: HttpHandler;
  readonly login: HttpHandler;
}

export function createAuthHandlers(deps: AuthHandlersDeps): AuthHandlers {
  return {
    register: async (req) => {
      try {
        const body = (req.body ?? {}) as { email?: string; password?: string };
        const result = await registerUser(deps, {
          email: String(body.email ?? ''),
          password: String(body.password ?? '')
        });
        return { status: 201, body: result };
      } catch (error) {
        return toProblem(error);
      }
    },
    login: async (req) => {
      try {
        const body = (req.body ?? {}) as { email?: string; password?: string };
        const result = await loginUser(deps, {
          email: String(body.email ?? ''),
          password: String(body.password ?? '')
        });
        return { status: 200, body: result };
      } catch (error) {
        return toProblem(error);
      }
    }
  };
}