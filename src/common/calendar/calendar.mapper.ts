import { CalendarEventResponseDto, CalendarConnectionResponseDto } from './dto';
import { CalendarConnection } from './entities/calendar.entity';
import type { CalendarEvent as ProviderEvent } from './providers/calendar-provider.interface';

type LinkedContact = {
    contactId: string;
    contactName?: string;
    relationshipType?: string;
};

type ProviderEventWithLinks = ProviderEvent & {
    externalEventId?: string;
    eventContacts?: Array<{ contactId: string; relationshipType?: string }>;
    linkedContacts?: LinkedContact[];
};

export class CalendarMapper {
    /**
     * Map CalendarConnection entity to response DTO
     */
    static mapConnectionToResponse(connection: CalendarConnection): CalendarConnectionResponseDto {
        return {
            id: connection.id,
            userId: connection.userId,
            provider: connection.provider,
            calendarId: connection.calendarId,
            calendarName: connection.calendarName,
            isActive: connection.isActive,
            lastSyncedAt: connection.lastSyncedAt,
            createdAt: connection.createdAt,
        };
    }

    // CalendarEvent mapping removed; consolidated on core events only

    // Map a provider event-like object to response DTO
    static mapEventToResponse(event: ProviderEventWithLinks): CalendarEventResponseDto {
        const linkedFromContacts: LinkedContact[] | undefined = Array.isArray(event.eventContacts)
            ? event.eventContacts.map((c) => ({
                  contactId: c.contactId,
                  contactName: 'Unknown',
                  relationshipType: c.relationshipType,
              }))
            : undefined;

        const normalizedLinked = (event.linkedContacts ?? linkedFromContacts)?.map((lc) => ({
            contactId: lc.contactId,
            contactName: lc.contactName ?? 'Unknown',
            relationshipType: lc.relationshipType ?? 'attendee',
        }));

        return {
            id: event.id,
            externalEventId: event.externalEventId ?? event.id,
            summary: event.summary,
            description: event.description,
            location: event.location,
            startTime: event.startTime,
            endTime: event.endTime,
            organizerEmail: event.organizerEmail,
            organizerName: event.organizerName,
            attendees: Array.isArray(event.attendees) ? event.attendees : [],
            isAllDay: Boolean(event.isAllDay),
            status: event.status,
            eventLink: event.eventLink,
            linkedContacts: normalizedLinked,
        };
    }

    static mapEventsToResponse(events: ProviderEventWithLinks[]): CalendarEventResponseDto[] {
        return Array.isArray(events) ? events.map((e) => this.mapEventToResponse(e)) : [];
    }
}
