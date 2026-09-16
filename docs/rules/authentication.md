# Enterprise Authentication, Token Rotation & WebAuthn

> **Core Mandate:** Enforce in-memory short-lived access tokens, cryptographic Refresh Token Rotation (RTR) with family revocation on replay detection, and FIDO2/WebAuthn passwordless authentication.

---

## 1. Token Lifecycles & Refresh Token Rotation (RTR)

- **Access Tokens**: Short-lived (15 minutes), stored strictly in-memory (never in `localStorage` or unencrypted client stores).
- **Refresh Tokens**: Long-lived (7–30 days), stored strictly in `HttpOnly`, `Secure`, `SameSite=Strict` cookies.
- **Cryptographic Rotation & Replay Detection**:
  - Store only SHA-256 hashes of refresh tokens in the database.
  - Track `familyId` across rotation cycles.
  - If an invalidated or already-used refresh token is presented (replay attack), **immediately invalidate the entire token family** and force re-authentication.

```typescript
import crypto from 'crypto';

export class TokenSecurity {
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
```

---

## 2. WebAuthn & Passwordless Authentication

- **FIDO2 / WebAuthn**: Standardize on open-source `@simplewebauthn` for passkey and biometric authentication.
- **Challenge Verification**: Verify server-generated cryptographic challenges against device public keys stored per credential.
- **Multi-Factor Authentication (TOTP)**: Utilize open-source `otplib` for time-based one-time password generation and verification.
