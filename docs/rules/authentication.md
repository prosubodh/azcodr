# Enterprise Authentication, Token Rotation & WebAuthn

> **Core Mandate:** Enforce in-memory short-lived access tokens, cryptographic Refresh Token Rotation (RTR) with family revocation on replay detection, FIDO2/WebAuthn passkeys, and OIDC federation.

---

## 1. Token Lifecycles & Cryptographic Refresh Token Rotation (RTR)

- **Access Tokens**: Short-lived (max 15 minutes), held strictly in volatile application memory or client memory (never persisted in unencrypted browser storage). Standardize on **PASETO** (Platform-Agnostic Security Tokens) or **RFC 7519 JWT** with asymmetric RSA/EdDSA keys published via `/.well-known/jwks.json`.
- **Refresh Tokens**: Stored strictly in `HttpOnly`, `Secure`, `SameSite=Strict` cookies or encrypted OS keyrings.
- **Cryptographic Rotation & Replay Detection Protocol**:
  - Persist only cryptographically salted hashes (e.g. SHA-256 / Argon2id) of refresh tokens in storage.
  - Group tokens by `family_id` across rotation cycles.
  - If an expired or already-consumed token in a family is presented (replay attack), **immediately invalidate the entire token family**, terminate active sessions, and emit a high-priority security alert.

---

## 2. FIDO2 / WebAuthn Passkeys & Multi-Factor Authentication

- **FIDO2 / WebAuthn Standard**: Support hardware security keys (YubiKey, Apple Touch ID/Face ID, Windows Hello) conforming to the W3C WebAuthn Level 3 specification.
- **Server Cryptographic Verification**: Validate hardware-signed cryptographic challenges against stored credential public keys using language-native WebAuthn verifier ports.
- **Time-Based One-Time Passwords (TOTP)**: Implement RFC 6238 compliant TOTP verification as an alternative MFA factor.

---

## 3. Enterprise Identity Federation & Workload Identity

- **OIDC & OAuth 2.1**: Standardize on OpenID Connect 1.0 Authorization Code Flow with PKCE for enterprise single sign-on (SSO) with Okta, Azure AD, Keycloak, or Google Workspace.
- **SCIM 2.0 Provisioning**: Implement RFC 7644 SCIM endpoints for automated tenant user synchronization and lifecycle de-provisioning.
- **Service-to-Service Workload Identity**: Utilize **SPIFFE / SPIRE** for zero-trust mutual TLS (mTLS) cryptographic attestation between polyglot microservices.
