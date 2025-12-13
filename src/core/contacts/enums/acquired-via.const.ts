/**
 * Contact acquisition methods
 */
export const ACQUIRED_VIA = {
    SCANNED: 'scanned',
    MANUAL: 'manual',
    EVENT: 'event',
    LOUNGE: 'lounge',
    CONTACT_CAPTURE_FORM: 'contact_capture_form',
    PHONE_IMPORT: 'phone_import',
} as const;

export type AcquiredVia = (typeof ACQUIRED_VIA)[keyof typeof ACQUIRED_VIA];

export const ACQUIRED_VIA_VALUES = Object.values(ACQUIRED_VIA) as readonly AcquiredVia[];
