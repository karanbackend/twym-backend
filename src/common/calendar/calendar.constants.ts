export const CALENDAR_PROVIDER = {
    GOOGLE: 'google',
    MICROSOFT: 'microsoft',
} as const;

export type CalendarProviderName = (typeof CALENDAR_PROVIDER)[keyof typeof CALENDAR_PROVIDER];

export const IDEMPOTENCY_ENDPOINTS = {
    EVENTS_IMPORT: 'events.import',
} as const;

export const IDEMPOTENCY_KEY_PREFIX = 'events:import' as const;

export const STATUS_MAPPING = {
    CANCELLED: 'cancelled',
} as const;

export const EVENT_STATUS = {
    DRAFT: 'draft',
    PUBLISHED: 'published',
    LIVE: 'live',
    COMPLETED: 'completed',
    CANCELED: 'canceled',
} as const;

export type EventStatus = (typeof EVENT_STATUS)[keyof typeof EVENT_STATUS];
/**
 * Calendar module constants
 */

export const CALENDAR_CONSTANTS = {
    // Cache duration for calendar events (15 minutes)
    CACHE_TTL_MS: 15 * 60 * 1000,

    // Default date range for syncing (2 years back and forth)
    DEFAULT_SYNC_YEARS_BACK: 2,
    DEFAULT_SYNC_YEARS_FORWARD: 2,

    // Maximum number of events to fetch per sync
    MAX_EVENTS_PER_SYNC: 2500,

    // Token refresh buffer (refresh if expiring within 5 minutes)
    TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000,

    // Maximum sync failure count before disabling connection
    MAX_SYNC_FAILURE_COUNT: 10,

    // Cron schedule for token refresh
    TOKEN_REFRESH_CRON: '0 * * * *', // Every hour

    // Provider identifiers
    PROVIDERS: {
        GOOGLE: 'google',
        MICROSOFT: 'microsoft',
    },

    // Relationship types for contact-event links
    RELATIONSHIP_TYPES: {
        ATTENDEE: 'attendee',
        ORGANIZER: 'organizer',
        MENTIONED: 'mentioned',
    },
} as const;

// Time constants
export const MS_PER_SECOND = 1000;
export const MS_PER_MINUTE = 60 * MS_PER_SECOND;
export const MS_PER_HOUR = 60 * MS_PER_MINUTE;
export const MS_PER_DAY = 24 * MS_PER_HOUR;
export const DEFAULT_CACHE_TTL_MS = 15 * MS_PER_MINUTE;
export const DEFAULT_SYNC_RANGE_MS = 2 * 365 * MS_PER_DAY; // 2 years
export const GOOGLE_CALENDAR_SCOPES = [
    'https://www.googleapis.com/auth/calendar.readonly',
    'https://www.googleapis.com/auth/calendar.events.readonly',
];

export const MICROSOFT_CALENDAR_SCOPES = [
    'https://graph.microsoft.com/Calendars.Read',
    'offline_access',
];
