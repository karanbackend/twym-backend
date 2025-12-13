/**
 * Email types for profiles
 */
export const EMAIL_TYPE = {
    WORK: 'work',
    PERSONAL: 'personal',
    OTHER: 'other',
} as const;

export type EmailType = (typeof EMAIL_TYPE)[keyof typeof EMAIL_TYPE];

export const EMAIL_TYPES = Object.values(EMAIL_TYPE) as readonly EmailType[];
