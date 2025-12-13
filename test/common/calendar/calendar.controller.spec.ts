/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { CalendarController } from '../../../src/common/calendar/calendar.controller';
import { CalendarService } from '../../../src/common/calendar/calendar.service';
import {
    ConnectCalendarDto,
    SyncCalendarDto,
    LinkContactToEventDto,
    CALENDAR_PROVIDERS,
} from '../../../src/common/calendar/dto';

describe('CalendarController', () => {
    let controller: CalendarController;
    let service: jest.Mocked<CalendarService>;

    const mockAuthUser = { id: 'user-123' };
    const mockConnectionId = 'connection-123';
    const mockEventId = 'event-123';
    const mockContactId = 'contact-123';

    beforeEach(async () => {
        const mockService = {
            connect: jest.fn(),
            disconnect: jest.fn(),
            getConnectionStatus: jest.fn(),
            getConnectionStatuses: jest.fn(),
            sync: jest.fn(),
            getEvents: jest.fn(),
            linkContactToEvent: jest.fn(),
            getContactEvents: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [CalendarController],
            providers: [
                {
                    provide: CalendarService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<CalendarController>(CalendarController);
        service = module.get(CalendarService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('connect', () => {
        const connectDto: ConnectCalendarDto = {
            provider: CALENDAR_PROVIDERS.GOOGLE,
            authorizationCode: 'auth-code-123',
            redirectUri: 'https://app.example.com/callback',
        };

        it('should successfully connect a calendar', async () => {
            const expectedResponse = {
                id: mockConnectionId,
                provider: CALENDAR_PROVIDERS.GOOGLE,
                providerAccountEmail: 'user@gmail.com',
                calendarName: 'My Calendar',
                isActive: true,
                connectedAt: new Date(),
                lastSyncAt: undefined,
            };

            service.connect.mockResolvedValue(expectedResponse);

            const result = await controller.connect(mockAuthUser, connectDto);

            expect(service.connect).toHaveBeenCalledWith(mockAuthUser.id, connectDto);
            expect(result).toEqual(expectedResponse);
        });

        it('should throw ConflictException if calendar already connected', async () => {
            service.connect.mockRejectedValue(new ConflictException('Calendar already connected'));

            await expect(controller.connect(mockAuthUser, connectDto)).rejects.toThrow(
                ConflictException,
            );
        });

        it('should throw BadRequestException for invalid authorization code', async () => {
            service.connect.mockRejectedValue(
                new BadRequestException('Invalid authorization code'),
            );

            await expect(controller.connect(mockAuthUser, connectDto)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('disconnect', () => {
        it('should successfully disconnect a calendar by provider', async () => {
            const expectedResponse = {
                success: true,
                message: 'Calendar disconnected successfully',
            };

            service.disconnect.mockResolvedValue(expectedResponse);

            await controller.disconnect(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE);

            expect(service.disconnect).toHaveBeenCalledWith(
                mockAuthUser.id,
                CALENDAR_PROVIDERS.GOOGLE,
            );
        });

        it('should throw NotFoundException if calendar not connected', async () => {
            service.disconnect.mockRejectedValue(
                new NotFoundException('Calendar connection not found'),
            );

            await expect(
                controller.disconnect(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('getStatus', () => {
        it('should return connection statuses (array)', async () => {
            const expectedStatus = [
                {
                    provider: CALENDAR_PROVIDERS.GOOGLE,
                    isConnected: true,
                    providerAccountEmail: 'user@gmail.com',
                    calendarName: 'My Calendar',
                    lastSyncAt: new Date(),
                },
                {
                    provider: CALENDAR_PROVIDERS.MICROSOFT,
                    isConnected: false,
                    providerAccountEmail: undefined,
                    calendarName: undefined,
                    lastSyncAt: undefined,
                },
            ];

            service.getConnectionStatuses.mockResolvedValue(expectedStatus);

            const result = await controller.getStatus(mockAuthUser);

            expect(service.getConnectionStatuses).toHaveBeenCalledWith(mockAuthUser.id, undefined);
            expect(result).toEqual(expectedStatus);
        });

        it('should handle when no calendars are connected', async () => {
            const expectedStatus = [
                {
                    provider: CALENDAR_PROVIDERS.GOOGLE,
                    isConnected: false,
                    providerAccountEmail: undefined,
                    calendarName: undefined,
                    lastSyncAt: undefined,
                },
                {
                    provider: CALENDAR_PROVIDERS.MICROSOFT,
                    isConnected: false,
                    providerAccountEmail: undefined,
                    calendarName: undefined,
                    lastSyncAt: undefined,
                },
            ];

            service.getConnectionStatuses.mockResolvedValue(expectedStatus);

            const result = await controller.getStatus(mockAuthUser);

            expect(result).toEqual(expectedStatus);
        });
    });

    describe('sync', () => {
        const syncDto: SyncCalendarDto = {
            provider: CALENDAR_PROVIDERS.GOOGLE,
            startDate: new Date('2024-01-01'),
            endDate: new Date('2024-12-31'),
        };

        it('should successfully sync calendar events', async () => {
            const expectedResponse = {
                success: true,
                eventsCount: 5,
                events: [
                    {
                        id: mockEventId,
                        summary: 'Meeting 1',
                        description: 'Description 1',
                        location: 'Location 1',
                        startTime: new Date('2024-06-01T10:00:00Z'),
                        endTime: new Date('2024-06-01T11:00:00Z'),
                        attendees: ['attendee@example.com'],
                    },
                ],
            };

            service.sync.mockResolvedValue(expectedResponse);

            const result = await controller.sync(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE, syncDto);

            expect(service.sync).toHaveBeenCalledWith(
                mockAuthUser.id,
                syncDto,
                CALENDAR_PROVIDERS.GOOGLE,
            );
            expect(result).toEqual(expectedResponse);
            expect(result.eventsCount).toBe(5);
        });

        it('should throw NotFoundException if calendar not connected', async () => {
            service.sync.mockRejectedValue(new NotFoundException('Calendar connection not found'));

            await expect(
                controller.sync(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE, syncDto),
            ).rejects.toThrow(NotFoundException);
        });

        it('should throw BadRequestException if connection is inactive', async () => {
            service.sync.mockRejectedValue(
                new BadRequestException('Calendar connection is not active'),
            );

            await expect(
                controller.sync(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE, syncDto),
            ).rejects.toThrow(BadRequestException);
        });

        it('should handle sync with empty date range', async () => {
            const emptyDto: SyncCalendarDto = {
                provider: CALENDAR_PROVIDERS.GOOGLE,
                startDate: new Date('2024-01-01'),
                endDate: new Date('2024-01-01'),
            };

            const expectedResponse = {
                success: true,
                eventsCount: 0,
                events: [],
            };

            service.sync.mockResolvedValue(expectedResponse);

            const result = await controller.sync(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE, emptyDto);

            expect(result.eventsCount).toBe(0);
            expect(result.events).toEqual([]);
        });
    });

    describe('getEvents', () => {
        // dates defined in provider path tests; not needed here

        it('should return calendar events', async () => {
            const expectedEvents = [
                {
                    id: mockEventId,
                    summary: 'Meeting 1',
                    description: 'Description 1',
                    location: 'Location 1',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: ['attendee@example.com'],
                },
            ];

            service.getEvents.mockResolvedValue(expectedEvents);

            const result = await controller.getEvents(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE);

            expect(service.getEvents).toHaveBeenCalledWith(
                mockAuthUser.id,
                CALENDAR_PROVIDERS.GOOGLE,
            );
            expect(result).toEqual(expectedEvents);
        });

        it('should return empty array when no events found', async () => {
            service.getEvents.mockResolvedValue([]);

            const result = await controller.getEvents(mockAuthUser, CALENDAR_PROVIDERS.GOOGLE);

            expect(result).toEqual([]);
        });

        it('should throw NotFoundException if calendar not connected', async () => {
            service.getEvents.mockRejectedValue(
                new NotFoundException('Calendar connection not found'),
            );

            await expect(controller.getEvents(mockAuthUser as any)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe.skip('linkContact', () => {
        const linkDto: LinkContactToEventDto = {
            eventId: mockEventId,
            contactId: mockContactId,
        };

        it('should successfully link contact to event', async () => {
            const expectedResponse = {
                success: true,
                message: 'Contact linked to event successfully',
            };

            service.linkContactToEvent.mockResolvedValue(expectedResponse);

            const result = await controller.linkContact(mockAuthUser, linkDto);

            expect(service.linkContactToEvent).toHaveBeenCalledWith(mockAuthUser.id, linkDto);
            expect(result).toEqual(expectedResponse);
        });

        it('should throw NotFoundException if event not found', async () => {
            service.linkContactToEvent.mockRejectedValue(new NotFoundException('Event not found'));

            await expect(controller.linkContact(mockAuthUser, linkDto)).rejects.toThrow(
                'Event not found',
            );
        });

        it('should throw BadRequestException if contact already linked', async () => {
            service.linkContactToEvent.mockRejectedValue(
                new BadRequestException('Contact already linked to this event'),
            );

            await expect(controller.linkContact(mockAuthUser, linkDto)).rejects.toThrow(
                'Contact already linked to this event',
            );
        });
    });

    describe.skip('getContactEvents', () => {
        it('should return events linked to a contact', async () => {
            const expectedEvents = [
                {
                    id: mockEventId,
                    summary: 'Meeting with Contact',
                    description: 'Description',
                    location: 'Location',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: ['contact@example.com'],
                },
            ];

            service.getContactEvents.mockResolvedValue(expectedEvents);

            const result = await controller.getContactEvents(mockAuthUser, mockContactId);

            expect(service.getContactEvents).toHaveBeenCalledWith(mockAuthUser.id, mockContactId);
            expect(result).toEqual(expectedEvents);
        });

        it('should return empty array when no events linked to contact', async () => {
            service.getContactEvents.mockResolvedValue([]);

            const result = await controller.getContactEvents(mockAuthUser, mockContactId);

            expect(result).toEqual([]);
        });
    });
});
