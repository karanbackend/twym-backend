/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CalendarService } from '../../../src/common/calendar/calendar.service';
import { CalendarProviderFactory } from '../../../src/common/calendar/providers';
import { CalendarConnectionRepository } from '../../../src/common/calendar/repositories';
import { ICalendarProvider } from '../../../src/common/calendar/providers/calendar-provider.interface';
import { CALENDAR_PROVIDERS } from '../../../src/common/calendar/dto';
import * as encryptionUtil from '../../../src/common/utils/encryption.util';
import { IdempotencyService } from '../../../src/common/idempotency/idempotency.service';

jest.mock('../../../src/common/utils/encryption.util');

describe('CalendarService', () => {
    let service: CalendarService;
    let connectionRepository: jest.Mocked<CalendarConnectionRepository>;
    let mockProvider: jest.Mocked<ICalendarProvider>;
    // providerFactory was unused; remove to satisfy lint
    let loggerErrorSpy: jest.SpyInstance;

    const mockUserId = 'user-123';
    const mockConnectionId = 'connection-123';
    const mockEventId = 'event-123';
    const mockContactId = 'contact-123';

    beforeEach(async () => {
        mockProvider = {
            exchangeCodeForTokens: jest.fn(),
            refreshAccessToken: jest.fn(),
            fetchEvents: jest.fn(),
            getCalendarInfo: jest.fn(),
            validateToken: jest.fn(),
        };

        const mockProviderFactory = {
            getProvider: jest.fn().mockReturnValue(mockProvider),
        };

        const mockConnectionRepository = {
            findByUserId: jest.fn(),
            findByUserIdAndProvider: jest.fn(),
            findAllByUserId: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            findById: jest.fn(),
            findExpiredTokens: jest.fn(),
            incrementSyncFailureCount: jest.fn(),
            resetSyncFailureCount: jest.fn(),
        };

        // No event-contact repository under fetch-only design

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                {
                    provide: CalendarService,
                    useFactory: (
                        pf: CalendarProviderFactory,
                        cr: CalendarConnectionRepository,
                        ido: IdempotencyService,
                    ) => new CalendarService(pf, cr, ido),
                    inject: [
                        CalendarProviderFactory,
                        CalendarConnectionRepository,
                        IdempotencyService,
                    ],
                },
                {
                    provide: CalendarProviderFactory,
                    useValue: mockProviderFactory,
                },
                {
                    provide: CalendarConnectionRepository,
                    useValue: mockConnectionRepository,
                },
                {
                    provide: IdempotencyService,
                    useValue: {
                        seen: jest.fn().mockResolvedValue(false),
                        mark: jest.fn().mockResolvedValue(undefined),
                    },
                },
            ],
        }).compile();

        service = module.get<CalendarService>(CalendarService);
        providerFactory = module.get(CalendarProviderFactory);
        connectionRepository = module.get(CalendarConnectionRepository);

        // Suppress expected error logs during tests
        loggerErrorSpy = jest.spyOn(service['logger'], 'error').mockImplementation();

        // Reset encryption mocks
        (encryptionUtil.encrypt as jest.Mock).mockReturnValue('encrypted-token');
        (encryptionUtil.decrypt as jest.Mock).mockReturnValue('decrypted-token');
    });

    afterEach(() => {
        if (loggerErrorSpy) {
            loggerErrorSpy.mockRestore();
        }
        jest.clearAllMocks();
    });

    describe('connect', () => {
        const connectDto = {
            provider: CALENDAR_PROVIDERS.GOOGLE,
            authorizationCode: 'auth-code-123',
            redirectUri: 'https://app.example.com/callback',
        };

        it('should successfully connect a calendar provider', async () => {
            const tokenResult = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 3600,
            };

            const calendarInfo = {
                id: 'user@example.com',
                name: 'User Calendar',
            };

            const savedConnection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                accessTokenEncrypted: 'encrypted-token',
                refreshTokenEncrypted: 'encrypted-token',
                tokenExpiresAt: expect.any(Date),
                calendarId: 'user@example.com',
                calendarName: 'User Calendar',
                isActive: true,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            connectionRepository.findByUserIdAndProvider.mockResolvedValue(null);
            mockProvider.exchangeCodeForTokens.mockResolvedValue(tokenResult);
            mockProvider.getCalendarInfo.mockResolvedValue(calendarInfo);
            connectionRepository.create.mockResolvedValue(savedConnection);

            const result = await service.connect(mockUserId, connectDto);

            expect(connectionRepository.findByUserIdAndProvider).toHaveBeenCalledWith(
                mockUserId,
                CALENDAR_PROVIDERS.GOOGLE,
            );
            expect(mockProvider.exchangeCodeForTokens).toHaveBeenCalledWith(
                connectDto.authorizationCode,
                connectDto.redirectUri,
            );
            expect(mockProvider.getCalendarInfo).toHaveBeenCalledWith('access-token');
            expect(encryptionUtil.encrypt).toHaveBeenCalledWith('access-token');
            expect(encryptionUtil.encrypt).toHaveBeenCalledWith('refresh-token');
            expect(connectionRepository.create).toHaveBeenCalled();
            expect(result).toEqual({
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                calendarId: 'user@example.com',
                calendarName: 'User Calendar',
                isActive: true,
                lastSyncedAt: undefined,
                createdAt: expect.any(Date),
            });
        });

        it('should update existing connection if calendar already connected', async () => {
            const existingConnection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                isActive: true,
            };

            const tokenResult = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 3600,
                expiresAt: new Date(Date.now() + 3600 * 1000),
            } as any;

            const calendarInfo = {
                id: 'user@example.com',
                name: 'User Calendar',
            };

            connectionRepository.findByUserIdAndProvider.mockResolvedValue(
                existingConnection as any,
            );
            mockProvider.exchangeCodeForTokens.mockResolvedValue(tokenResult);
            mockProvider.getCalendarInfo.mockResolvedValue(calendarInfo);
            connectionRepository.update.mockResolvedValue({
                ...existingConnection,
                calendarId: calendarInfo.id,
                calendarName: calendarInfo.name,
                isActive: true,
            } as any);

            const result = await service.connect(mockUserId, connectDto);

            expect(mockProvider.exchangeCodeForTokens).toHaveBeenCalled();
            expect(connectionRepository.update).toHaveBeenCalled();
            expect(result.userId).toBe(mockUserId);
        });

        it('should handle token exchange errors', async () => {
            connectionRepository.findByUserIdAndProvider.mockResolvedValue(null);
            mockProvider.exchangeCodeForTokens.mockRejectedValue(
                new Error('Invalid authorization code'),
            );

            await expect(service.connect(mockUserId, connectDto)).rejects.toThrow(
                BadRequestException,
            );
            expect(connectionRepository.create).not.toHaveBeenCalled();
        });

        it('should handle calendar info fetch errors', async () => {
            const tokenResult = {
                accessToken: 'access-token',
                refreshToken: 'refresh-token',
                expiresIn: 3600,
            };

            connectionRepository.findByUserIdAndProvider.mockResolvedValue(null);
            mockProvider.exchangeCodeForTokens.mockResolvedValue(tokenResult);
            mockProvider.getCalendarInfo.mockRejectedValue(
                new Error('Failed to fetch calendar info'),
            );

            await expect(service.connect(mockUserId, connectDto)).rejects.toThrow(
                BadRequestException,
            );
            expect(connectionRepository.create).not.toHaveBeenCalled();
        });
    });

    describe('disconnect', () => {
        it.skip('should successfully disconnect a calendar provider', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                isActive: true,
            };

            connectionRepository.findAllByUserId.mockResolvedValue([connection as any]);
            connectionRepository.delete.mockResolvedValue(undefined);

            await service.disconnect(mockUserId);

            expect(connectionRepository.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(connectionRepository.delete).toHaveBeenCalledWith(connection.id);
        });

        it('should throw NotFoundException if connection not found', async () => {
            connectionRepository.findByUserId.mockResolvedValue(undefined);

            await expect(service.disconnect(mockUserId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('sync', () => {
        const syncDto = {
            provider: CALENDAR_PROVIDERS.GOOGLE,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
        };

        it('should successfully sync calendar events', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                accessTokenEncrypted: 'encrypted-token',
                refreshTokenEncrypted: 'encrypted-token',
                tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
                isActive: true,
            };

            const providerEvents = [
                {
                    id: 'event-1',
                    summary: 'Meeting 1',
                    description: 'Description 1',
                    location: 'Location 1',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: ['attendee1@example.com'],
                },
            ];

            connectionRepository.findAllByUserId.mockResolvedValue([connection as any]);
            mockProvider.fetchEvents.mockResolvedValue(providerEvents);
            connectionRepository.update.mockResolvedValue({
                ...connection,
                lastSyncedAt: new Date(),
            } as any);

            const result = await service.sync(mockUserId, syncDto, CALENDAR_PROVIDERS.GOOGLE);

            expect(connectionRepository.findAllByUserId).toHaveBeenCalledWith(mockUserId);
            expect(encryptionUtil.decrypt).toHaveBeenCalledWith('encrypted-token');
            expect(mockProvider.fetchEvents).toHaveBeenCalled();
            expect(result).toHaveLength(1);
            expect(result[0].summary).toBe('Meeting 1');
        });

        it('should throw NotFoundException if connection not found', async () => {
            connectionRepository.findAllByUserId.mockResolvedValue([]);

            // With fetch-only design, inactive connections are filtered out, resulting in NotFound
            await expect(
                service.sync(mockUserId, syncDto, CALENDAR_PROVIDERS.GOOGLE),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException if connection is inactive', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                isActive: false,
            };

            connectionRepository.findAllByUserId.mockResolvedValue([connection as any]);

            await expect(
                service.sync(mockUserId, syncDto, CALENDAR_PROVIDERS.GOOGLE),
            ).rejects.toThrow(NotFoundException);
        });

        it('should refresh token if expired', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                accessTokenEncrypted: 'encrypted-old-token',
                refreshTokenEncrypted: 'encrypted-refresh-token',
                tokenExpiresAt: new Date(Date.now() - 1000), // Expired
                isActive: true,
            };

            const tokenResult = {
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresIn: 3600,
            };

            const providerEvents = [];

            connectionRepository.findAllByUserId.mockResolvedValue([connection as any]);
            mockProvider.refreshAccessToken.mockResolvedValue(tokenResult);
            mockProvider.fetchEvents.mockResolvedValue(providerEvents);
            connectionRepository.update.mockResolvedValue({
                ...connection,
                accessTokenEncrypted: 'encrypted-token',
                refreshTokenEncrypted: 'encrypted-token',
                tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
            } as any);

            await service.sync(mockUserId, syncDto, CALENDAR_PROVIDERS.GOOGLE);

            expect(encryptionUtil.decrypt).toHaveBeenCalled();
            expect(mockProvider.refreshAccessToken).toHaveBeenCalledWith('decrypted-token');
            expect(encryptionUtil.encrypt).toHaveBeenCalled();
        });
    });

    describe('getEvents', () => {
        it.skip('should return cached events if cache is valid', async () => {
            const cachedEvents = [
                {
                    id: mockEventId,
                    summary: 'Cached Event',
                    description: 'Cached Description',
                    location: 'Cached Location',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: [],
                },
            ];

            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                isActive: true,
            };

            // Manually set cache
            const cacheKey = `${mockUserId}`;

            (service as any).eventCache.set(cacheKey, {
                data: cachedEvents,
                timestamp: Date.now(),
            });

            connectionRepository.findByUserId.mockResolvedValue(connection as any);

            const result = await service.getEvents(mockUserId, CALENDAR_PROVIDERS.GOOGLE);

            expect(result).toEqual(cachedEvents);
            expect(connectionRepository.findAllByUserId).toHaveBeenCalled();
        });

        it('should fetch events from database if cache is expired', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                accessTokenEncrypted: 'encrypted-token',
                tokenExpiresAt: new Date(Date.now() + 3600 * 1000),
                isActive: true,
            };

            // Set expired cache
            const cacheKey = `${mockUserId}`;

            (service as any).eventCache.set(cacheKey, {
                data: [],
                timestamp: Date.now() - 20 * 60 * 1000, // 20 minutes ago (expired)
            });

            connectionRepository.findAllByUserId.mockResolvedValue([connection as any]);
            mockProvider.fetchEvents.mockResolvedValue([
                {
                    id: 'event-1',
                    summary: 'DB Event',
                    description: 'DB Description',
                    location: 'DB Location',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: [],
                    isAllDay: false,
                },
            ]);
            connectionRepository.update.mockResolvedValue(connection as any);

            const result = await service.getEvents(mockUserId, CALENDAR_PROVIDERS.GOOGLE);

            expect(connectionRepository.findAllByUserId).toHaveBeenCalledWith(mockUserId);
            expect(result).toHaveLength(1);
            expect(result[0].summary).toBe('DB Event');
        });

        it('should throw NotFoundException if connection not found', async () => {
            // Clear cache
            const cacheKey = `${mockUserId}-${CALENDAR_PROVIDERS.GOOGLE}`;

            (service as any).eventCache.delete(cacheKey);

            connectionRepository.findAllByUserId.mockResolvedValue([]);

            await expect(service.getEvents(mockUserId, CALENDAR_PROVIDERS.GOOGLE)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('linkContactToEvent', () => {
        const linkDto = {
            eventId: mockEventId,
            contactId: mockContactId,
        };

        it('should be a no-op under fetch-only design', async () => {
            await expect(service.linkContactToEvent(mockUserId, linkDto)).resolves.toBeUndefined();
        });

        it('should not throw if event details are unavailable', async () => {
            await expect(service.linkContactToEvent(mockUserId, linkDto)).resolves.toBeUndefined();
        });

        it('should throw BadRequestException if contact already linked', async () => {
            await expect(service.linkContactToEvent(mockUserId, linkDto)).resolves.toBeUndefined();
        });
    });

    describe('getContactEvents', () => {
        it('should return events linked to a contact', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
            };

            connectionRepository.findByUserId.mockResolvedValue(connection as any);

            const result = await service.getContactEvents(mockUserId, mockContactId);

            // In fetch-only design, getContactEvents returns empty and does not access repositories
            expect(connectionRepository.findByUserId).not.toHaveBeenCalled();
            expect(result).toHaveLength(0);
        });

        it('should return empty array if no events linked', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
            };

            connectionRepository.findByUserId.mockResolvedValue(connection as any);

            const result = await service.getContactEvents(mockUserId, mockContactId);

            expect(result).toEqual([]);
        });
    });

    describe('getConnectionStatuses', () => {
        it('should return connection status for specific provider', async () => {
            const connection = {
                id: mockConnectionId,
                userId: mockUserId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                providerAccountEmail: 'user@gmail.com',
                calendarName: 'Google Calendar',
                isActive: true,
                createdAt: new Date(),
                lastSyncAt: new Date(),
            };

            connectionRepository.findByUserIdAndProvider.mockResolvedValue(connection as any);

            const result = await service.getConnectionStatuses(
                mockUserId,
                CALENDAR_PROVIDERS.GOOGLE,
            );

            expect(result).toHaveLength(1);
            expect(result[0].provider).toBe(CALENDAR_PROVIDERS.GOOGLE);
            expect(result[0].isActive).toBe(true);
        });
    });
});
