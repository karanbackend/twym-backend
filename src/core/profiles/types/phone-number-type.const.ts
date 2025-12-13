/**
 * Phone number types for profiles
 */
export const PHONE_NUMBER_TYPE = {
    WORK: 'work',
    MOBILE: 'mobile',
    FAX: 'fax',
    HOME: 'home',
} as const;

export type PhoneNumberType = (typeof PHONE_NUMBER_TYPE)[keyof typeof PHONE_NUMBER_TYPE];

export const PHONE_NUMBER_TYPES = Object.values(PHONE_NUMBER_TYPE) as readonly PhoneNumberType[];
