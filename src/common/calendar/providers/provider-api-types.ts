/**
 * Type definitions for external calendar provider API responses
 * These types help us maintain type safety when parsing API responses
 */

// Google Calendar API Types
export interface GoogleTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
}

export interface GoogleCalendarInfo {
    id: string;
    summary?: string;
}

export interface GoogleCalendarEvent {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    start?: {
        dateTime?: string;
        date?: string;
    };
    end?: {
        dateTime?: string;
        date?: string;
    };
    organizer?: {
        email?: string;
        displayName?: string;
    };
    attendees?: Array<{
        email?: string;
        displayName?: string;
        responseStatus?: string;
    }>;
    status?: string;
    htmlLink?: string;
}

export interface GoogleEventsListResponse {
    items?: GoogleCalendarEvent[];
}

// Microsoft Graph API Types
export interface MicrosoftTokenResponse {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    token_type?: string;
    scope?: string;
}

export interface MicrosoftCalendarInfo {
    id: string;
    name?: string;
}

export interface MicrosoftCalendarEvent {
    id: string;
    subject?: string;
    bodyPreview?: string;
    body?: {
        content?: string;
    };
    location?: {
        displayName?: string;
    };
    start?: {
        dateTime?: string;
    };
    end?: {
        dateTime?: string;
    };
    organizer?: {
        emailAddress?: {
            name?: string;
            address?: string;
        };
    };
    attendees?: Array<{
        emailAddress?: {
            name?: string;
            address?: string;
        };
        status?: {
            response?: string;
        };
    }>;
    isAllDay?: boolean;
    showAs?: string;
    webLink?: string;
}

export interface MicrosoftEventsListResponse {
    value?: MicrosoftCalendarEvent[];
}
