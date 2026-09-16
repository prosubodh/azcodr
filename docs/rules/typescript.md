# TypeScript & Quality Standards

> **Core Mandate:** Enforce maximum TypeScript compiler strictness, branded nominal typing for domain identifiers, strict prohibition of `any`, and automated pre-commit quality guardrails.

---

## 1. Strict Compiler Configuration

Maintain maximum compiler rigor in `tsconfig.json` to prevent subtle runtime bugs:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 2. Branded Nominal Typing

Prevent accidental mixing of primitive identifiers (e.g. passing a `TenantId` where a `UserId` is expected):

```typescript
declare const __brand: unique symbol;
export type Brand<T, B> = T & { readonly [__brand]: B };

export type TenantId = Brand<string, 'TenantId'>;
export type UserId = Brand<string, 'UserId'>;
export type OrderId = Brand<string, 'OrderId'>;

export const asTenantId = (id: string): TenantId => id as TenantId;
export const asUserId = (id: string): UserId => id as UserId;
```

---

## 3. Strict Type Narrowing & Pre-Commit Guardrails

- **Strict Prohibition of `any`**: The use of `any` is strictly prohibited. Use `unknown` with runtime type narrowing (e.g. Zod schemas or custom type guards) instead.
- **Runtime Standardization**: Standardize strictly on Node 24 / npm 11 across local development, `.nvmrc`, `package.json#engines`, and Docker container base images (`node:24-alpine`).
- **Commit Guardrails**: Enforce Conventional Commits via `commitlint`. Never bypass pre-commit hooks (`lint-staged` running ESLint, Prettier, and TypeScript typechecking).
