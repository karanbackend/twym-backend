/**
 * Subscription tier types
 */
export const SUBSCRIPTION_TIER = {
    FREE: 'free',
    PRO: 'pro',
    PRO_PLUS: 'pro_plus',
    ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionTier = (typeof SUBSCRIPTION_TIER)[keyof typeof SUBSCRIPTION_TIER];

export const SUBSCRIPTION_TIERS = Object.values(SUBSCRIPTION_TIER) as readonly SubscriptionTier[];
