import {
    Injectable,
    InternalServerErrorException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { URLSearchParams } from 'url';
import { AppConfig } from '../../config/app.config';
import {
    ICalendarProvider,
    CalendarEvent,
    TokenRefreshResult,
} from './calendar-provider.interface';
import type {
    GoogleTokenResponse,
    GoogleCalendarInfo,
    GoogleEventsListResponse,
    GoogleCalendarEvent,
} from './provider-api-types';

@Injectable()
export class GoogleCalendarProvider implements ICalendarProvider {
    private readonly logger = new Logger(GoogleCalendarProvider.name);
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly tokenEndpoint = 'https://oauth2.googleapis.com/token';
    private readonly calendarApiBase = 'https://www.googleapis.com/calendar/v3';

    constructor(private appConfig: AppConfig) {
        this.clientId = this.appConfig.calendar.google.clientId;
        this.clientSecret = this.appConfig.calendar.google.clientSecret;
    }

    async exchangeCodeForTokens(
        authorizationCode: string,
        redirectUri?: string,
    ): Promise<TokenRefreshResult> {
        try {
            if (!redirectUri) {
                this.logger.error('Missing redirectUri when exchanging authorization code');
                throw new InternalServerErrorException(
                    'Redirect URI is required and must match the OAuth client configuration',
                );
            }
            const response = await fetch(this.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    code: authorizationCode,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    redirect_uri: redirectUri,
                    grant_type: 'authorization_code',
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorObj: { error?: string; error_description?: string };
                try {
                    errorObj = JSON.parse(errorText) as {
                        error?: string;
                        error_description?: string;
                    };
                } catch {
                    errorObj = {
                        error: 'unknown_error',
                        error_description: errorText,
                    };
                }
                const desc = errorObj?.error_description || errorText;
                this.logger.error(`Token exchange failed: ${errorText}`);
                if (errorObj?.error === 'invalid_request') {
                    throw new BadRequestException(
                        `Google OAuth invalid_request: ${desc}. Ensure consent screen is in Testing with test users or verified, and redirect_uri matches the OAuth client.`,
                    );
                }
                if (errorObj?.error === 'invalid_grant') {
                    throw new BadRequestException(
                        `Google OAuth invalid_grant: ${desc}. The authorization code may be expired, already used, or the redirect_uri/client_id mismatch. Retry the OAuth flow fresh and ensure the same client_id and exact redirect_uri are used for both authorize and token steps.`,
                    );
                }
                if (errorObj?.error === 'redirect_uri_mismatch') {
                    this.logger.error(
                        `Redirect URI mismatch. Provided redirect_uri: ${redirectUri}`,
                    );
                    throw new BadRequestException(
                        `Google OAuth redirect_uri_mismatch: ${desc}. The redirect_uri sent in token exchange must exactly match the one used in the authorize step and be listed under Authorized redirect URIs in your OAuth client. Provided: ${redirectUri}`,
                    );
                }
                throw new InternalServerErrorException(
                    `Failed to exchange authorization code: ${errorText}`,
                );
            }
            const data = (await response.json()) as GoogleTokenResponse;

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt: data.expires_in
                    ? new Date(Date.now() + data.expires_in * 1000)
                    : undefined,
            };
        } catch (error) {
            this.logger.error('Error exchanging code for tokens', error);
            throw error;
        }
    }

    // Removed custom IPv4 POST helper in favor of fetch for testability

    async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
        try {
            const response = await fetch(this.tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    refresh_token: refreshToken,
                    client_id: this.clientId,
                    client_secret: this.clientSecret,
                    grant_type: 'refresh_token',
                }),
            });

            if (!response.ok) {
                const error = await response.text();
                this.logger.error(`Token refresh failed: ${error}`);
                throw new InternalServerErrorException(`Failed to refresh token: ${error}`);
            }

            const data = (await response.json()) as GoogleTokenResponse;

            return {
                accessToken: data.access_token,
                refreshToken: data.refresh_token || refreshToken,
                expiresAt: data.expires_in
                    ? new Date(Date.now() + data.expires_in * 1000)
                    : undefined,
            };
        } catch (error) {
            this.logger.error('Error refreshing access token', error);
            throw error;
        }
    }

    async fetchEvents(
        accessToken: string,
        startDate: Date,
        endDate: Date,
    ): Promise<CalendarEvent[]> {
        try {
            const url = new URL(`${this.calendarApiBase}/calendars/primary/events`);
            url.searchParams.append('timeMin', startDate.toISOString());
            url.searchParams.append('timeMax', endDate.toISOString());
            url.searchParams.append('singleEvents', 'true');
            url.searchParams.append('orderBy', 'startTime');
            url.searchParams.append('maxResults', '2500');

            const response = await fetch(url.toString(), {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const error = await response.text();
                this.logger.error(`Fetch events failed: ${error}`);
                throw new Error(`Failed to fetch events: ${error}`);
            }

            const data = (await response.json()) as GoogleEventsListResponse;
            return this.mapGoogleEventsToCalendarEvents(data.items || []);
        } catch (error) {
            this.logger.error('Error fetching events', error);
            throw error;
        }
    }

    async getCalendarInfo(accessToken: string): Promise<{
        id: string;
        name: string;
    }> {
        try {
            const response = await fetch(`${this.calendarApiBase}/calendars/primary`, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            if (!response.ok) {
                const error = await response.text();
                this.logger.error(`Get calendar info failed: ${error}`);
                throw new InternalServerErrorException(`Failed to get calendar info: ${error}`);
            }

            const data = (await response.json()) as GoogleCalendarInfo;

            return {
                id: data.id,
                name: data.summary || 'Primary Calendar',
            };
        } catch (error) {
            this.logger.error('Error getting calendar info', error);
            throw error;
        }
    }

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(
                `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`,
            );

            return response.ok;
        } catch (error) {
            this.logger.error('Error validating token', error);
            return false;
        }
    }

    private mapGoogleEventsToCalendarEvents(googleEvents: GoogleCalendarEvent[]): CalendarEvent[] {
        return googleEvents.map((event) => ({
            id: event.id,
            summary: event.summary,
            description: event.description,
            location: event.location,
            startTime: new Date(event.start?.dateTime || event.start?.date || ''),
            endTime: new Date(event.end?.dateTime || event.end?.date || ''),
            organizerEmail: event.organizer?.email,
            organizerName: event.organizer?.displayName,
            attendees: event.attendees
                ?.filter((attendee) => attendee.email)
                .map((attendee) => ({
                    email: attendee.email!,
                    name: attendee.displayName,
                    responseStatus: attendee.responseStatus,
                })),
            isAllDay: !event.start?.dateTime,
            status: event.status,
            eventLink: event.htmlLink,
        }));
    }
}
