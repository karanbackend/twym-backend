import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import {
    ConnectCalendarDto,
    SyncCalendarDto,
    LinkContactToEventDto,
    CalendarEventResponseDto,
    CalendarConnectionResponseDto,
    type CalendarProvider,
} from './dto';
import { CalendarProviderFactory } from './providers';
import { encrypt, decrypt } from '../utils/encryption.util';
import { CalendarConnection } from './entities/calendar.entity';
import { CalendarConnectionRepository } from './repositories';
import { CalendarMapper } from './calendar.mapper';
import { IdempotencyService } from '../idempotency/idempotency.service';
import {
    IDEMPOTENCY_KEY_PREFIX,
    STATUS_MAPPING,
    EVENT_STATUS,
    DEFAULT_CACHE_TTL_MS,
    DEFAULT_SYNC_RANGE_MS,
} from './calendar.constants';

@Injectable()
export class CalendarService {
    private readonly logger = new Logger(CalendarService.name);
    private readonly CACHE_TTL = DEFAULT_CACHE_TTL_MS; // 15 minutes
    private readonly eventCache = new Map<
        string,
        { data: CalendarEventResponseDto[]; timestamp: number }
    >();

    private getCacheKey(userId: string, provider?: CalendarProvider): string {
        return provider ? `${userId}:${provider}` : `${userId}:all`;
    }

    constructor(
        private readonly providerFactory: CalendarProviderFactory,
        private readonly connectionRepository: CalendarConnectionRepository,
        private readonly idempotencyService: IdempotencyService,
    ) {}

    /**
     * Connect a calendar provider (Google or Microsoft)
     */
    async connect(
        userId: string,
        connectDto: ConnectCalendarDto,
    ): Promise<CalendarConnectionResponseDto> {
        this.logger.log(`Connecting ${connectDto.provider} calendar for user ${userId}`);

        // Allow multiple active connections (google, microsoft) — check by provider
        const existingConnection = await this.connectionRepository.findByUserIdAndProvider(
            userId,
            connectDto.provider,
        );

        try {
            // Get the appropriate provider
            const provider = this.providerFactory.getProvider(connectDto.provider);

            // Exchange authorization code for tokens
            const tokens = await provider.exchangeCodeForTokens(
                connectDto.authorizationCode,
                connectDto.redirectUri,
            );

            // Get calendar info
            const calendarInfo = await provider.getCalendarInfo(tokens.accessToken);

            // Encrypt tokens
            const accessTokenEncrypted = encrypt(tokens.accessToken);
            const refreshTokenEncrypted = tokens.refreshToken ? encrypt(tokens.refreshToken) : null;

            // Create or update connection
            let connection;
            if (existingConnection) {
                connection = await this.connectionRepository.update(existingConnection.id, {
                    provider: connectDto.provider,
                    accessTokenEncrypted,
                    refreshTokenEncrypted: refreshTokenEncrypted ?? undefined,
                    tokenExpiresAt: tokens.expiresAt,
                    calendarId: calendarInfo.id,
                    calendarName: calendarInfo.name,
                    isActive: true,
                    syncFailureCount: 0,
                    lastSyncError: undefined,
                });
            } else {
                connection = await this.connectionRepository.create({
                    userId,
                    provider: connectDto.provider,
                    accessTokenEncrypted,
                    refreshTokenEncrypted: refreshTokenEncrypted ?? undefined,
                    tokenExpiresAt: tokens.expiresAt,
                    calendarId: calendarInfo.id,
                    calendarName: calendarInfo.name,
                    isActive: true,
                });
            }

            this.logger.log(
                `Successfully connected ${connectDto.provider} calendar for user ${userId}`,
            );

            return CalendarMapper.mapConnectionToResponse(connection as CalendarConnection);
        } catch (error) {
            this.logger.error(`Failed to connect calendar for user ${userId}`, error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new BadRequestException(`Failed to connect calendar: ${errorMessage}`);
        }
    }

    /**
     * Disconnect calendar
     */
    async disconnect(userId: string, provider?: CalendarProvider): Promise<void> {
        this.logger.log(
            `Disconnecting calendar for user ${userId}${provider ? ` (${provider})` : ''}`,
        );

        if (provider) {
            const connection = await this.connectionRepository.findByUserIdAndProvider(
                userId,
                provider,
            );
            if (!connection) {
                throw new NotFoundException('No calendar connection found for provider');
            }
            await this.connectionRepository.delete(connection.id);
        } else {
            const connections = await this.connectionRepository.findAllByUserId(userId);
            if (!connections || connections.length === 0) {
                throw new NotFoundException('No calendar connection found');
            }
            for (const c of connections) {
                await this.connectionRepository.delete(c.id);
            }
        }

        // Clear cache for specific provider or all for user
        if (provider) {
            this.eventCache.delete(this.getCacheKey(userId, provider));
        } else {
            const prefix = `${userId}:`;
            for (const key of this.eventCache.keys()) {
                if (key.startsWith(prefix)) {
                    this.eventCache.delete(key);
                }
            }
        }

        this.logger.log(`Successfully disconnected calendar for user ${userId}`);
    }

    /**
     * Sync calendar events
     */
    async sync(
        userId: string,
        syncDto: SyncCalendarDto = {},
        provider?: CalendarProvider,
    ): Promise<CalendarEventResponseDto[]> {
        this.logger.log(`Syncing calendar for user ${userId}`);

        let connections = await this.connectionRepository.findAllByUserId(userId);
        connections = (connections || []).filter((c) => c.isActive);
        if (provider) {
            connections = connections.filter((c) => c.provider === provider);
        }
        if (!connections || connections.length === 0) {
            throw new NotFoundException('No active calendar connection found');
        }

        // Check cache first (per user+provider)
        if (!syncDto.forceRefresh) {
            const cached = this.eventCache.get(this.getCacheKey(userId, provider));
            if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
                this.logger.log(`Returning cached events for user ${userId}`);
                return cached.data;
            }
        }

        try {
            // Calculate date range (default: 2 years back and forth)
            const startDate = syncDto.startDate
                ? new Date(syncDto.startDate)
                : new Date(Date.now() - DEFAULT_SYNC_RANGE_MS);
            const endDate = syncDto.endDate
                ? new Date(syncDto.endDate)
                : new Date(Date.now() + DEFAULT_SYNC_RANGE_MS);
            const allResponses: CalendarEventResponseDto[] = [];

            for (const connection of connections) {
                // Get access token
                let accessToken: string | undefined;
                try {
                    accessToken = decrypt(connection.accessTokenEncrypted);
                } catch {
                    this.logger.error(`Failed to decrypt access token for user ${userId}`);
                    accessToken = undefined;
                }

                // Check if token is expired and refresh if needed
                if (connection.tokenExpiresAt && new Date(connection.tokenExpiresAt) < new Date()) {
                    this.logger.log(`Token expired, refreshing for user ${userId}`);
                    accessToken = await this.refreshToken({
                        id: connection.id,
                        refreshTokenEncrypted: connection.refreshTokenEncrypted,
                        provider: connection.provider,
                    });
                }

                // Fetch events from provider
                const provider = this.providerFactory.getProvider(
                    connection.provider as CalendarProvider,
                );
                const events = await provider.fetchEvents(accessToken ?? '', startDate, endDate);

                // Idempotency filter: optional; if not storing, we can skip marking
                const filtered: typeof events = [];
                for (const e of events) {
                    const idempotencyKey = `${IDEMPOTENCY_KEY_PREFIX}:${connection.userId}:${connection.provider}:${e.id}`;
                    const seen =
                        this.idempotencyService &&
                        typeof this.idempotencyService.seen === 'function'
                            ? await this.idempotencyService.seen(idempotencyKey)
                            : false;
                    if (!seen) {
                        filtered.push(e);
                    }
                }

                // Update last synced timestamp
                await this.connectionRepository.update(connection.id, {
                    lastSyncedAt: new Date(),
                    lastSyncError: undefined,
                });
                await this.connectionRepository.resetSyncFailureCount(connection.id);

                // Build response directly from provider events
                const response = filtered.map((e) => ({
                    id: e.id,
                    externalEventId: e.id,
                    summary: e.summary,
                    description: e.description,
                    location: e.location,
                    startTime: e.startTime,
                    endTime: e.endTime,
                    organizerEmail: e.organizerEmail,
                    organizerName: e.organizerName,
                    attendees: e.attendees || [],
                    isAllDay: e.isAllDay || false,
                    status:
                        e.status === STATUS_MAPPING.CANCELLED
                            ? EVENT_STATUS.CANCELED
                            : EVENT_STATUS.PUBLISHED,
                    eventLink: e.eventLink,
                    linkedContacts: [],
                }));
                allResponses.push(...response);
            }

            // Sort combined events by startTime
            allResponses.sort(
                (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
            );

            // Update cache per user+provider
            this.eventCache.set(this.getCacheKey(userId, provider), {
                data: allResponses,
                timestamp: Date.now(),
            });

            this.logger.log(
                `Successfully synced unified calendar across ${connections.length} connection(s) for user ${userId}`,
            );

            return allResponses;
        } catch (error) {
            this.logger.error(`Failed to sync calendar for user ${userId}`, error);

            // Update sync failure
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            // If multiple connections, mark failure on all
            const connections = await this.connectionRepository.findAllByUserId(userId);
            for (const c of connections) {
                await this.connectionRepository.update(c.id, {
                    lastSyncError: errorMessage,
                });
                const repoWithOptional = this.connectionRepository as unknown as {
                    incrementSyncFailureCount?: (id: string) => Promise<void> | void;
                };
                if (typeof repoWithOptional.incrementSyncFailureCount === 'function') {
                    await repoWithOptional.incrementSyncFailureCount(c.id);
                }
            }

            throw new BadRequestException(`Failed to sync calendar: ${errorMessage}`);
        }
    }

    /**
     * Get calendar events
     */
    async getEvents(
        userId: string,
        provider?: CalendarProvider,
    ): Promise<CalendarEventResponseDto[]> {
        // Use sync with cache
        return this.sync(userId, { forceRefresh: false }, provider);
    }

    /**
     * Link a contact to a calendar event
     */
    async linkContactToEvent(_userId: string, _linkDto: LinkContactToEventDto): Promise<void> {
        void _userId;
        void _linkDto;
        await Promise.resolve();
        // const connection = await this.connectionRepository.findByUserId(userId);
        // if (!connection) {
        //   throw new NotFoundException('No calendar connection found');
        // }
        // const event = await this.eventsService.findById(linkDto.eventId);
        // if (!event || event.organizerId !== connection.userId) {
        //   throw new NotFoundException('Event not found');
        // }
        // const existingLink = await this.eventContactRepository.findByEventAndContact(
        //   linkDto.eventId,
        //   linkDto.contactId,
        // );
        // if (existingLink) {
        //   throw new ConflictException('Contact already linked to this event');
        // }
        // await this.eventContactRepository.create({
        //   eventId: linkDto.eventId,
        //   contactId: linkDto.contactId,
        //   relationshipType: linkDto.relationshipType || 'attendee',
        //   notes: linkDto.notes,
        // });
        // // Clear cache
        // this.eventCache.delete(userId);
        // this.logger.log(
        //   `Successfully linked contact ${linkDto.contactId} to event ${linkDto.eventId}`,
        // );
    }

    /**
     * Unlink a contact from an event
     */
    async unlinkContactFromEvent(
        _userId: string,
        _eventId: string,
        _contactId: string,
    ): Promise<void> {
        void _userId;
        void _eventId;
        void _contactId;
        await Promise.resolve();
        // const connections = await this.connectionRepository.findAllByUserId(userId);
        // if (!connections || connections.length === 0) {
        //   throw new NotFoundException('No calendar connection found');
        // }
        // const event = await this.eventsService.findById(eventId);
        // if (!event) {
        //   throw new NotFoundException('Event not found');
        // }
        // const ownsEvent = connections.some((c) => c.userId === event.organizerId);
        // if (!ownsEvent) {
        //   throw new NotFoundException('Event not found for this user');
        // }
        // await this.eventContactRepository.delete(eventId, contactId);
        // this.eventCache.delete(userId);
    }

    /**
     * Get events linked to a contact
     */
    async getContactEvents(
        _userId: string,
        _contactId: string,
    ): Promise<CalendarEventResponseDto[]> {
        void _userId;
        void _contactId;
        await Promise.resolve();
        return [];
    }

    /**
     * Get calendar connection status
     */
    async getConnectionStatuses(
        userId: string,
        provider?: CalendarProvider,
    ): Promise<CalendarConnectionResponseDto[]> {
        if (provider) {
            const connection = await this.connectionRepository.findByUserIdAndProvider(
                userId,
                provider,
            );
            return connection ? [CalendarMapper.mapConnectionToResponse(connection)] : [];
        }

        const connections = await this.connectionRepository.findAllByUserId(userId);
        return connections.map((c) => CalendarMapper.mapConnectionToResponse(c));
    }

    async getAllConnectionStatuses(userId: string): Promise<CalendarConnectionResponseDto[]> {
        const connections = await this.connectionRepository.findAllByUserId(userId);
        return connections.map((c) => CalendarMapper.mapConnectionToResponse(c));
    }

    /**
     * Refresh access token
     */
    private async refreshToken(connection: {
        id: string;
        refreshTokenEncrypted?: string | null;
        provider: string;
    }): Promise<string> {
        if (!connection.refreshTokenEncrypted) {
            throw new BadRequestException('No refresh token available');
        }

        const refreshToken = decrypt(connection.refreshTokenEncrypted);
        const provider = this.providerFactory.getProvider(connection.provider as CalendarProvider);

        const tokens = await provider.refreshAccessToken(refreshToken);

        // Encrypt and save new tokens
        const accessTokenEncrypted = encrypt(tokens.accessToken);
        const refreshTokenEncrypted = tokens.refreshToken
            ? encrypt(tokens.refreshToken)
            : connection.refreshTokenEncrypted;

        await this.connectionRepository.update(connection.id, {
            accessTokenEncrypted,
            refreshTokenEncrypted,
            tokenExpiresAt: tokens.expiresAt,
        });

        return tokens.accessToken;
    }
}
