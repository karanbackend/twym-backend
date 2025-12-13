export interface CalendarEvent {
    id: string;
    summary?: string;
    description?: string;
    location?: string;
    startTime: Date;
    endTime: Date;
    organizerEmail?: string;
    organizerName?: string;
    attendees?: Array<{
        email: string;
        name?: string;
        responseStatus?: string;
    }>;
    isAllDay: boolean;
    status?: string;
    eventLink?: string;
}

export interface TokenRefreshResult {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
}

export interface ICalendarProvider {
    /**
     * Exchange authorization code for access tokens
     */
    exchangeCodeForTokens(
        authorizationCode: string,
        redirectUri?: string,
    ): Promise<TokenRefreshResult>;

    /**
     * Refresh access token using refresh token
     */
    refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult>;

    /**
     * Fetch calendar events within a date range
     */
    fetchEvents(accessToken: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]>;

    /**
     * Get primary calendar information
     */
    getCalendarInfo(accessToken: string): Promise<{
        id: string;
        name: string;
    }>;

    /**
     * Validate if access token is still valid
     */
    validateToken(accessToken: string): Promise<boolean>;
}
