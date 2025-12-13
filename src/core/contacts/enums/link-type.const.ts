/**
 * Link types
 */
export const LINK_TYPE = {
    WEBSITE: 'website',
    SOCIAL: 'social',
} as const;

export type LinkType = (typeof LINK_TYPE)[keyof typeof LINK_TYPE];

export const LINK_TYPES = Object.values(LINK_TYPE) as readonly LinkType[];
