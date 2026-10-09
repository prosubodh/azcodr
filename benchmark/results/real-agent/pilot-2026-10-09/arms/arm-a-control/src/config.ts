// Central configuration. Values can be overridden via environment variables.
export const VERSION = "arm-a-control";

export const JWT_SECRET: string = process.env.JWT_SECRET ?? "dev-jwt-secret-change-me";
export const JWT_TTL_SECONDS: number = 15 * 60; // T02: access tokens expire after 15 minutes
export const STRIPE_WEBHOOK_SECRET: string =
  process.env.STRIPE_WEBHOOK_SECRET ?? "whsec_dev_test_secret";
export const OUTBOX_BATCH_SIZE: number = 100;

// T05: billing feature gates keyed by subscription tier.
export const BILLING_PLANS = {
  free: {
    maxMembers: 5,
    auditRetentionDays: 7,
    apiKeys: false,
    sso: false,
  },
  pro: {
    maxMembers: 100,
    auditRetentionDays: 365,
    apiKeys: true,
    sso: true,
  },
} as const;

export type BillingTier = keyof typeof BILLING_PLANS;
export type BillingFeature = keyof typeof BILLING_PLANS.free;