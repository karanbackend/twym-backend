/**
 * Scan types for contacts acquired via scanning
 */
export const SCANNED_TYPE = {
    QR_CODE: 'qr_code',
    BUSINESS_CARD: 'business_card',
    EVENT_BADGE: 'event_badge',
} as const;

export type ScannedType = (typeof SCANNED_TYPE)[keyof typeof SCANNED_TYPE];

export const SCANNED_TYPES = Object.values(SCANNED_TYPE) as readonly ScannedType[];
