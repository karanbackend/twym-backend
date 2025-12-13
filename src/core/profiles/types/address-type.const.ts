/**
 * Address types for profiles
 */
export const ADDRESS_TYPE = {
    BUSINESS: 'business',
    HOME: 'home',
    OTHER: 'other',
} as const;

export type AddressType = (typeof ADDRESS_TYPE)[keyof typeof ADDRESS_TYPE];

export const ADDRESS_TYPES = Object.values(ADDRESS_TYPE) as readonly AddressType[];
