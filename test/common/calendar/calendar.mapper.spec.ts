import { CalendarMapper } from '../../../src/common/calendar/calendar.mapper';
import { CalendarConnection } from '../../../src/common/calendar/entities/calendar.entity';
import { CalendarEvent } from '../../../src/common/calendar/entities/calendar-event.entity';
import { CALENDAR_PROVIDERS } from '../../../src/common/calendar/dto';

describe('CalendarMapper', () => {
    describe('mapConnectionToResponse', () => {
        it('should map CalendarConnection entity to response DTO', () => {
            const connection = {
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                calendarId: 'calendar-123',
                calendarName: 'My Calendar',
                isActive: true,
                lastSyncedAt: new Date('2024-06-01T10:00:00Z'),
                createdAt: new Date('2024-01-01T10:00:00Z'),
                updatedAt: new Date('2024-06-01T10:00:00Z'),
            } as CalendarConnection;

            const result = CalendarMapper.mapConnectionToResponse(connection);

            expect(result).toEqual({
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                calendarId: 'calendar-123',
                calendarName: 'My Calendar',
                isActive: true,
                lastSyncedAt: new Date('2024-06-01T10:00:00Z'),
                createdAt: new Date('2024-01-01T10:00:00Z'),
            });
        });

        it('should handle connection with null lastSyncedAt', () => {
            const connection = {
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.MICROSOFT,
                calendarId: 'calendar-123',
                calendarName: 'Work Calendar',
                isActive: true,
                lastSyncedAt: undefined,
                createdAt: new Date('2024-01-01T10:00:00Z'),
            } as CalendarConnection;

            const result = CalendarMapper.mapConnectionToResponse(connection);

            expect(result.lastSyncedAt).toBeUndefined();
        });

        it('should handle inactive connection', () => {
            const connection = {
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                calendarId: 'calendar-123',
                calendarName: 'Disconnected Calendar',
                isActive: false,
                lastSyncedAt: new Date('2024-05-01T10:00:00Z'),
                createdAt: new Date('2024-01-01T10:00:00Z'),
            } as CalendarConnection;

            const result = CalendarMapper.mapConnectionToResponse(connection);

            expect(result.isActive).toBe(false);
        });
    });

    describe('mapEventToResponse', () => {
        it('should map CalendarEvent entity to response DTO', () => {
            const event = {
                id: 'event-123',
                externalEventId: 'external-event-123',
                summary: 'Team Meeting',
                description: 'Discuss project updates',
                location: 'Conference Room A',
                startTime: new Date('2024-06-01T10:00:00Z'),
                endTime: new Date('2024-06-01T11:00:00Z'),
                organizerEmail: 'organizer@example.com',
                organizerName: 'John Organizer',
                attendees: ['attendee1@example.com', 'attendee2@example.com'],
                isAllDay: false,
                status: 'confirmed',
                eventLink: 'https://calendar.google.com/event?eid=123',
                eventContacts: [
                    {
                        contactId: 'contact-123',
                        relationshipType: 'attendee',
                    },
                ],
            } as CalendarEvent;

            const result = CalendarMapper.mapEventToResponse(event);

            expect(result).toEqual({
                id: 'event-123',
                externalEventId: 'external-event-123',
                summary: 'Team Meeting',
                description: 'Discuss project updates',
                location: 'Conference Room A',
                startTime: new Date('2024-06-01T10:00:00Z'),
                endTime: new Date('2024-06-01T11:00:00Z'),
                organizerEmail: 'organizer@example.com',
                organizerName: 'John Organizer',
                attendees: ['attendee1@example.com', 'attendee2@example.com'],
                isAllDay: false,
                status: 'confirmed',
                eventLink: 'https://calendar.google.com/event?eid=123',
                linkedContacts: [
                    {
                        contactId: 'contact-123',
                        contactName: 'Unknown',
                        relationshipType: 'attendee',
                    },
                ],
            });
        });

        it('should handle event with no description', () => {
            const event = {
                id: 'event-123',
                externalEventId: 'external-event-123',
                summary: 'Quick Sync',
                description: undefined,
                location: 'Office',
                startTime: new Date('2024-06-01T14:00:00Z'),
                endTime: new Date('2024-06-01T14:30:00Z'),
                organizerEmail: 'organizer@example.com',
                organizerName: 'Jane Organizer',
                attendees: [],
                isAllDay: false,
                status: 'confirmed',
                eventLink: undefined,
            } as CalendarEvent;

            const result = CalendarMapper.mapEventToResponse(event);

            expect(result.description).toBeUndefined();
            expect(result.attendees).toEqual([]);
            expect(result.eventLink).toBeUndefined();
        });

        it('should handle all-day event', () => {
            const event = {
                id: 'event-123',
                externalEventId: 'external-event-123',
                summary: 'Holiday',
                description: 'Public Holiday',
                location: undefined,
                startTime: new Date('2024-06-01T00:00:00Z'),
                endTime: new Date('2024-06-02T00:00:00Z'),
                organizerEmail: undefined,
                organizerName: undefined,
                attendees: [],
                isAllDay: true,
                status: 'confirmed',
                eventLink: undefined,
            } as CalendarEvent;

            const result = CalendarMapper.mapEventToResponse(event);

            expect(result.isAllDay).toBe(true);
            expect(result.location).toBeUndefined();
            expect(result.organizerEmail).toBeUndefined();
        });

        it('should handle event with no linked contacts', () => {
            const event = {
                id: 'event-123',
                externalEventId: 'external-event-123',
                summary: 'Solo Task',
                startTime: new Date('2024-06-01T09:00:00Z'),
                endTime: new Date('2024-06-01T10:00:00Z'),
                attendees: [],
                isAllDay: false,
                status: 'confirmed',
                eventContacts: undefined,
            } as CalendarEvent;

            const result = CalendarMapper.mapEventToResponse(event);

            expect(result.linkedContacts).toBeUndefined();
        });

        it('should handle event with multiple linked contacts', () => {
            const event = {
                id: 'event-123',
                externalEventId: 'external-event-123',
                summary: 'Client Meeting',
                startTime: new Date('2024-06-01T15:00:00Z'),
                endTime: new Date('2024-06-01T16:00:00Z'),
                attendees: ['client1@example.com', 'client2@example.com'],
                isAllDay: false,
                status: 'confirmed',
                eventContacts: [
                    {
                        contactId: 'contact-123',
                        relationshipType: 'organizer',
                    },
                    {
                        contactId: 'contact-456',
                        relationshipType: 'attendee',
                    },
                ],
            } as CalendarEvent;

            const result = CalendarMapper.mapEventToResponse(event);

            expect(result.linkedContacts).toHaveLength(2);
            expect(result.linkedContacts![0].contactId).toBe('contact-123');
            expect(result.linkedContacts![1].contactId).toBe('contact-456');
        });
    });

    describe('mapEventsToResponse', () => {
        it('should map multiple CalendarEvent entities to response DTOs', () => {
            const events = [
                {
                    id: 'event-1',
                    externalEventId: 'external-1',
                    summary: 'Meeting 1',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: [],
                    isAllDay: false,
                    status: 'confirmed',
                },
                {
                    id: 'event-2',
                    externalEventId: 'external-2',
                    summary: 'Meeting 2',
                    startTime: new Date('2024-06-02T14:00:00Z'),
                    endTime: new Date('2024-06-02T15:00:00Z'),
                    attendees: [],
                    isAllDay: false,
                    status: 'confirmed',
                },
            ] as CalendarEvent[];

            const result = CalendarMapper.mapEventsToResponse(events);

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('event-1');
            expect(result[0].summary).toBe('Meeting 1');
            expect(result[1].id).toBe('event-2');
            expect(result[1].summary).toBe('Meeting 2');
        });

        it('should return empty array for empty input', () => {
            const result = CalendarMapper.mapEventsToResponse([]);

            expect(result).toEqual([]);
        });

        it('should handle single event in array', () => {
            const events = [
                {
                    id: 'event-1',
                    externalEventId: 'external-1',
                    summary: 'Single Meeting',
                    startTime: new Date('2024-06-01T10:00:00Z'),
                    endTime: new Date('2024-06-01T11:00:00Z'),
                    attendees: [],
                    isAllDay: false,
                    status: 'confirmed',
                },
            ] as CalendarEvent[];

            const result = CalendarMapper.mapEventsToResponse(events);

            expect(result).toHaveLength(1);
            expect(result[0].summary).toBe('Single Meeting');
        });
    });
});
