import { createHmac, timingSafeEqual } from 'node:crypto';
import type { StripeSignatureVerifierPort } from '../domain/ports/payment.ts';

export interface StripeSignatureVerifierOptions {
  readonly secret: string;
  readonly toleranceSeconds?: number;
}

/**
 * Stripe webhook signature verifier (node:crypto only). Verifies the
 * `t=<unix>,v1=<hmac-sha256 hex>` header over the raw payload, rejects
 * signatures older than the tolerance window, and compares in constant time.
 */
export function createStripeSignatureVerifier(options: StripeSignatureVerifierOptions): StripeSignatureVerifierPort {
  const toleranceSeconds = options.toleranceSeconds ?? 300;
  return {
    verify(payload, signatureHeader) {
      if (typeof payload !== 'string' || payload.length === 0) return false;
      const values = new Map<string, string>();
      for (const part of signatureHeader.split(',')) {
        const separator = part.indexOf('=');
        if (separator === -1) continue;
        values.set(part.slice(0, separator), part.slice(separator + 1));
      }
      const t = values.get('t');
      const v1 = values.get('v1');
      if (t === undefined || v1 === undefined) return false;
      const ageSeconds = Math.abs(Date.now() / 1000 - Number(t));
      if (Number.isNaN(ageSeconds) || ageSeconds > toleranceSeconds) return false;
      const expected = createHmac('sha256', options.secret).update(`${t}.${payload}`).digest('hex');
      return constantTimeEqual(expected, v1);
    }
  };
}

function constantTimeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}