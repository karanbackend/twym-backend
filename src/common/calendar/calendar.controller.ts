import { Body, Controller, Get, Post, Delete, Query, Param } from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiOkResponse,
    ApiResponse,
    ApiBody,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import {
    ConnectCalendarDto,
    SyncCalendarDto,
    CalendarEventResponseDto,
    CalendarConnectionResponseDto,
    type CalendarProvider,
} from './dto';
import { CurrentAuthUser } from '../decorators/current-auth-user.decorator';

@ApiTags('Calendar')
@ApiBearerAuth()
@Controller('calendar')
export class CalendarController {
    constructor(private readonly calendarService: CalendarService) {}

    @Post('connect')
    @ApiOperation({
        summary: 'Connect a calendar provider',
        description:
            'Exchanges an authorization code for tokens and stores an active connection for the current user.',
    })
    @ApiBody({ type: ConnectCalendarDto })
    @ApiOkResponse({
        description: 'Active calendar connection',
        type: CalendarConnectionResponseDto,
    })
    connect(@CurrentAuthUser() user: { id: string }, @Body() dto: ConnectCalendarDto) {
        return this.calendarService.connect(user.id, dto);
    }

    @Delete(':provider/disconnect')
    @ApiOperation({
        summary: 'Disconnect calendar',
        description:
            "Removes the user's specific calendar connection by provider and clears cached events.",
    })
    @ApiResponse({ status: 200, description: 'Disconnected successfully' })
    disconnect(
        @CurrentAuthUser() user: { id: string },
        @Param('provider') provider: CalendarProvider,
    ) {
        return this.calendarService.disconnect(user.id, provider);
    }

    @Get('status')
    @ApiOperation({
        summary: 'Get connection statuses',
        description:
            'Returns all statuses when provider is not provided; returns the specific provider status when provided.',
    })
    @ApiOkResponse({
        description: 'List of connections',
        type: CalendarConnectionResponseDto,
        isArray: true,
    })
    getStatus(
        @CurrentAuthUser() user: { id: string },
        @Query('provider') provider?: CalendarProvider,
    ) {
        return this.calendarService.getConnectionStatuses(user.id, provider);
    }

    @Post(':provider/sync')
    @ApiOperation({
        summary: 'Sync calendar events',
        description:
            'Fetches events within an optional date range and caches results briefly for faster subsequent loads.',
    })
    @ApiBody({ type: SyncCalendarDto })
    @ApiOkResponse({
        description: 'List of events',
        type: CalendarEventResponseDto,
        isArray: true,
    })
    sync(
        @CurrentAuthUser() user: { id: string },
        @Param('provider') provider: CalendarProvider,
        @Body() dto: SyncCalendarDto,
    ) {
        return this.calendarService.sync(user.id, dto, provider);
    }

    @Get(':provider/events')
    @ApiOperation({
        summary: 'Get events',
        description: 'Returns events from the last successful sync, using cache if available.',
    })
    @ApiOkResponse({
        description: 'List of events',
        type: CalendarEventResponseDto,
        isArray: true,
    })
    getEvents(
        @CurrentAuthUser() user: { id: string },
        @Param('provider') provider: CalendarProvider,
    ) {
        return this.calendarService.getEvents(user.id, provider);
    }

    /*
  @Post('link')
  @ApiOperation({ summary: 'Link contact to event', description: 'Associates a contact with a calendar event.' })
  @ApiBody({ type: LinkContactToEventDto })
  @ApiResponse({ status: 200, description: 'Linked successfully' })
  linkContact(@CurrentAuthUser() user: { id: string }, @Body() dto: LinkContactToEventDto) {
    return this.calendarService.linkContactToEvent(user.id, dto);
  }

  @Get('contacts/:contactId/events')
  @ApiOperation({ summary: 'Get contact events', description: 'Lists events linked to a specific contact.' })
  @ApiOkResponse({ description: 'List of events for contact', type: CalendarEventResponseDto, isArray: true })
  getContactEvents(@CurrentAuthUser() user: { id: string }, contactId: string) {
    return this.calendarService.getContactEvents(user.id, contactId);
  }
    */
}
