import { IsBoolean, IsDateString, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SyncCalendarDto {
    @ApiProperty({
        description: 'Start date (inclusive) in ISO 8601 format',
        required: false,
        example: '2024-01-01T00:00:00.000Z',
    })
    @IsDateString()
    @IsOptional()
    startDate?: string;

    @ApiProperty({
        description: 'End date (inclusive) in ISO 8601 format',
        required: false,
        example: '2024-12-31T23:59:59.999Z',
    })
    @IsDateString()
    @IsOptional()
    endDate?: string;

    @ApiProperty({
        description: 'Force bypassing cache and re-fetch events',
        required: false,
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    forceRefresh?: boolean;
}

export class LinkContactToEventDto {
    @ApiProperty({ description: 'Event ID (UUID)' })
    @IsUUID()
    @IsString()
    eventId: string;

    @ApiProperty({ description: 'Contact ID (UUID)' })
    @IsUUID()
    @IsString()
    contactId: string;

    @ApiProperty({
        description: 'Relationship between the contact and the event',
        required: false,
        enum: ['attendee', 'organizer', 'mentioned'],
    })
    @IsString()
    @IsOptional()
    relationshipType?: 'attendee' | 'organizer' | 'mentioned';

    @ApiProperty({
        description: 'Free-text notes about the link',
        required: false,
    })
    @IsString()
    @IsOptional()
    notes?: string;
}

export class CalendarEventResponseDto {
    @ApiProperty({ description: 'Internal event identifier' })
    id: string;
    @ApiProperty({ description: 'Provider event ID' })
    externalEventId: string;
    @ApiProperty({ description: 'Event title/summary', required: false })
    summary?: string;
    @ApiProperty({ description: 'Event description', required: false })
    description?: string;
    @ApiProperty({ description: 'Event location', required: false })
    location?: string;
    @ApiProperty({
        description: 'Start time (ISO 8601)',
        type: String,
        format: 'date-time',
    })
    startTime: Date;
    @ApiProperty({
        description: 'End time (ISO 8601)',
        type: String,
        format: 'date-time',
    })
    endTime: Date;
    @ApiProperty({ description: 'Organizer email', required: false })
    organizerEmail?: string;
    @ApiProperty({ description: 'Organizer name', required: false })
    organizerName?: string;
    @ApiProperty({
        description: 'Event attendees',
        required: false,
        type: [Object],
    })
    attendees?: Array<{
        email: string;
        name?: string;
        responseStatus?: string;
    }>;
    @ApiProperty({
        description: 'Whether the event is all-day',
        default: false,
    })
    isAllDay: boolean;
    @ApiProperty({
        description: 'Event status (mapped from provider)',
        required: false,
    })
    status?: string;
    @ApiProperty({
        description: 'Link to the event in the provider UI',
        required: false,
    })
    eventLink?: string;
    @ApiProperty({
        description: 'Linked contacts',
        required: false,
        type: [Object],
    })
    linkedContacts?: Array<{
        contactId: string;
        contactName: string;
        relationshipType: string;
    }>;
}

export class CalendarConnectionResponseDto {
    @ApiProperty({ description: 'Connection ID' })
    id: string;
    @ApiProperty({ description: 'User ID' })
    userId: string;
    @ApiProperty({ description: 'Calendar provider (e.g., google, microsoft)' })
    provider: string;
    @ApiProperty({ description: 'Primary calendar ID', required: false })
    calendarId?: string;
    @ApiProperty({ description: 'Calendar display name', required: false })
    calendarName?: string;
    @ApiProperty({ description: 'Whether the connection is active' })
    isActive: boolean;
    @ApiProperty({
        description: 'Last synchronization timestamp',
        required: false,
        type: String,
        format: 'date-time',
    })
    lastSyncedAt?: Date;
    @ApiProperty({
        description: 'Creation timestamp',
        type: String,
        format: 'date-time',
    })
    createdAt: Date;
}
