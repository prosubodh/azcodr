/**
 * Edge authentication for inbound provider webhooks (HMAC-signed payloads).
 * Verification belongs behind a port so the payment domain never depends on a
 * specific transport/crypto implementation (docs/rules/security_compliance.md).
 */
export interface StripeSignatureVerifierPort {
  verify(payload: string, signatureHeader: string): boolean;
}