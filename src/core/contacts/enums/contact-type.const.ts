/**
 * Contact types
 */
export const CONTACT_TYPE = {
    TWYM_USER: 'twym_user',
    EXTERNAL: 'external',
} as const;

export type ContactType = (typeof CONTACT_TYPE)[keyof typeof CONTACT_TYPE];

export const CONTACT_TYPES = Object.values(CONTACT_TYPE) as readonly ContactType[];
