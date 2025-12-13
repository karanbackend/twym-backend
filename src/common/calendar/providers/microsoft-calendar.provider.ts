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
    MicrosoftTokenResponse,
    MicrosoftCalendarInfo,
    MicrosoftEventsListResponse,
    MicrosoftCalendarEvent,
} from './provider-api-types';

@Injectable()
export class MicrosoftCalendarProvider implements ICalendarProvider {
    private readonly logger = new Logger(MicrosoftCalendarProvider.name);
    private readonly clientId: string;
    private readonly clientSecret: string;
    private readonly tenantId: string;
    private readonly tokenEndpoint: string;
    private readonly graphApiBase = 'https://graph.microsoft.com/v1.0';

    constructor(private appConfig: AppConfig) {
        this.clientId = this.appConfig.calendar.microsoft.clientId;
        this.clientSecret = this.appConfig.calendar.microsoft.clientSecret;
        this.tenantId = this.appConfig.calendar.microsoft.tenantId;
        this.tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
    }

    async exchangeCodeForTokens(
        authorizationCode: string,
        redirectUri: string,
    ): Promise<TokenRefreshResult> {
        if (!redirectUri) {
            this.logger.error('Missing redirectUri when exchanging authorization code (Microsoft)');
            throw new BadRequestException(
                'Redirect URI is required and must match the Azure app registration configuration',
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
                scope: 'https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Token exchange failed: ${errorText}`);
            let parsed: { error?: string; error_description?: string };
            try {
                parsed = JSON.parse(errorText) as {
                    error?: string;
                    error_description?: string;
                };
            } catch {
                parsed = {
                    error: 'unknown_error',
                    error_description: errorText,
                };
            }
            const err = parsed.error;
            const desc = parsed.error_description;
            if (err === 'invalid_request') {
                throw new BadRequestException(
                    `Microsoft OAuth invalid_request: ${desc || errorText}. Ensure client_id, client_secret, redirect_uri are present and match the app registration.`,
                );
            }
            if (err === 'invalid_grant') {
                throw new BadRequestException(
                    `Microsoft OAuth invalid_grant: ${desc || errorText}. The authorization code may be expired/used, or redirect_uri/client_id mismatch. Retry the auth flow with the same client and exact redirect URI.`,
                );
            }
            throw new InternalServerErrorException(
                `Failed to exchange authorization code: ${errorText}`,
            );
        }
        const data = (await response.json()) as MicrosoftTokenResponse;

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
        };
    }

    async refreshAccessToken(refreshToken: string): Promise<TokenRefreshResult> {
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
                scope: 'https://graph.microsoft.com/Calendars.ReadWrite https://graph.microsoft.com/User.Read offline_access',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            this.logger.error(`Token refresh failed: ${errorText}`);
            throw new InternalServerErrorException(`Failed to refresh token: ${errorText}`);
        }

        const data = (await response.json()) as MicrosoftTokenResponse;

        try {
            const parts = (data.access_token || '').split('.');
            if (parts.length === 3) {
                const payloadJson = Buffer.from(parts[1], 'base64').toString('utf8');
                const payload = JSON.parse(payloadJson) as Record<string, unknown>;
                const aud = payload['aud'] as string | undefined;
                const scp = payload['scp'] as string | undefined;
                this.logger.log(`Microsoft refreshed token claims: aud=${aud}; scp=${scp}`);
            }
        } catch {
            // Intentionally ignore token parsing errors for logging
        }

        return {
            accessToken: data.access_token,
            refreshToken: data.refresh_token || refreshToken,
            expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : undefined,
        };
    }

    // Removed custom IPv4 POST helper in favor of fetch for testability

    // Use fetch for Graph API requests in tests for easier mocking

    async fetchEvents(
        accessToken: string,
        startDate: Date,
        endDate: Date,
    ): Promise<CalendarEvent[]> {
        const url = new URL(`${this.graphApiBase}/me/calendarview`);
        url.searchParams.append('startDateTime', startDate.toISOString());
        url.searchParams.append('endDateTime', endDate.toISOString());
        url.searchParams.append('$orderby', 'start/dateTime');
        url.searchParams.append('$top', '2500');

        const response = await fetch(url.toString(), {
            headers: {
                Authorization: `Bearer ${accessToken}`,
                Prefer: 'outlook.timezone="UTC"',
            },
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`Fetch events failed: ${error}`);
            if (response.status === 401 || response.status === 403) {
                throw new BadRequestException(
                    `Microsoft Graph unauthorized when fetching events. status=${response.status}; body=${error}`,
                );
            }
            throw new InternalServerErrorException(`Failed to fetch events: ${error}`);
        }

        const data = (await response.json()) as MicrosoftEventsListResponse;
        return this.mapMicrosoftEventsToCalendarEvents(data.value || []);
    }

    async getCalendarInfo(accessToken: string): Promise<{ id: string; name: string }> {
        const response = await fetch(`${this.graphApiBase}/me/calendar`, {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });

        if (!response.ok) {
            const error = await response.text();
            this.logger.error(`Get calendar info failed: ${error}`);
            throw new InternalServerErrorException(`Failed to get calendar info: ${error}`);
        }

        const data = (await response.json()) as MicrosoftCalendarInfo;
        return {
            id: data.id,
            name: data.name || 'Calendar',
        };
    }

    async validateToken(accessToken: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.graphApiBase}/me`, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });
            return response.ok;
        } catch (error) {
            this.logger.error(`Token validation failed: ${error}`);
            return false;
        }
    }

    private mapMicrosoftEventsToCalendarEvents(
        microsoftEvents: MicrosoftCalendarEvent[],
    ): CalendarEvent[] {
        return microsoftEvents.map((event) => ({
            id: event.id,
            summary: event.subject,
            description: event.bodyPreview || event.body?.content,
            location: event.location?.displayName,
            startTime: new Date((event.start?.dateTime || '') + 'Z'),
            endTime: new Date((event.end?.dateTime || '') + 'Z'),
            organizerEmail: event.organizer?.emailAddress?.address,
            organizerName: event.organizer?.emailAddress?.name,
            attendees: event.attendees
                ?.filter((a) => a.emailAddress?.address)
                .map((a) => ({
                    email: a.emailAddress!.address!,
                    name: a.emailAddress?.name,
                    responseStatus: a.status?.response,
                })),
            isAllDay: event.isAllDay || false,
            status: event.showAs,
            eventLink: event.webLink,
        }));
    }
}
