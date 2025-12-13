/**
 * Constants for contacts module
 */

// OCR Engine identifiers
export const OCR_ENGINE = {
    GOOGLE_VISION: 'google_vision',
} as const;

// Processing statuses
export const PROCESSING_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    SUCCEEDED: 'succeeded',
    FAILED: 'failed',
} as const;

// Document types
export const DOCUMENT_TYPE = {
    BUSINESS_CARD: 'business_card',
} as const;

// Card sides
export const CARD_SIDE = {
    FRONT: 'front',
    BACK: 'back',
} as const;

// Contact acquisition methods
export const ACQUIRED_VIA = {
    MANUAL: 'manual',
    SCANNED: 'scanned',
    EVENT: 'event',
    LOUNGE: 'lounge',
    PHONE_IMPORT: 'phone_import',
} as const;

// Scanned types
export const SCANNED_TYPE = {
    QR_CODE: 'qr_code',
    EVENT_BADGE: 'event_badge',
} as const;

// Automatic tags
export const AUTO_TAG = {
    QR_SCAN: 'QR Scan',
    EVENT_BADGE: 'Event Badge',
} as const;

// Validation limits
export const VALIDATION_LIMITS = {
    MAX_TAGS_PER_CONTACT: 100,
    MAX_TAG_LENGTH: 32,
} as const;

// Error messages
export const ERROR_MESSAGES = {
    CONTACT_NOT_FOUND: 'Contact not found',
    CONTACT_FILE_NOT_FOUND: 'Contact file not found',
    UNAUTHORIZED: 'Unauthorized',
    MAX_TAGS_EXCEEDED: 'Maximum 100 tags allowed per contact',
    TAG_TOO_LONG: 'Tag length cannot exceed 32 characters',
    DUPLICATE_CONTACT: 'A similar contact already exists',
    DUPLICATE_SCANNED: 'This contact was already scanned',
    EVENT_CONTACTS_FAILED: 'Failed to create event contacts',
} as const;

// Log messages
export const LOG_MESSAGES = {
    CONTACT_CREATED: (id: string, via: string, userId: string) =>
        `Contact created: ${id} via ${via} for user ${userId}`,
    SCANNED_CONTACT_CREATED: (id: string, type: string, userId: string) =>
        `Scanned contact created: ${id} (${type}) for user ${userId}`,
    BUSINESS_CARD_UPLOADED: (id: string, userId: string, cached: boolean) =>
        `Business card uploaded: ${id} for user ${userId}${cached ? ' (cached)' : ''}`,
    USING_CACHED_OCR: (hash: string) => `Using cached OCR for business card (hash: ${hash})`,
    OCR_DISABLED: 'Google OCR is disabled; leaving business card processing as pending',
    OCR_NOT_PROVIDED: 'OCR service not provided; leaving processing as pending',
    OCR_PROCESSED: (fileId: string) => `OCR processed for file ${fileId}`,
    CONTACT_SOFT_DELETED: (id: string) => `Contact soft-deleted: ${id}`,
    OCR_FAILED: 'OCR service failed for uploaded business card',
} as const;
