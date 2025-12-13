import { Injectable, NotImplementedException } from '@nestjs/common';
import { ICalendarProvider } from './calendar-provider.interface';
import { GoogleCalendarProvider } from './google-calendar.provider';
import { MicrosoftCalendarProvider } from './microsoft-calendar.provider';
import { CalendarProvider, CALENDAR_PROVIDERS } from '../dto';

@Injectable()
export class CalendarProviderFactory {
    private readonly providers: Record<string, ICalendarProvider>;

    constructor(
        googleProvider: GoogleCalendarProvider,
        microsoftProvider: MicrosoftCalendarProvider,
    ) {
        this.providers = {
            [CALENDAR_PROVIDERS.GOOGLE]: googleProvider,
            [CALENDAR_PROVIDERS.MICROSOFT]: microsoftProvider,
        };
    }

    getProvider(provider: CalendarProvider): ICalendarProvider {
        const key = provider.toLowerCase();

        const instance = this.providers[key];
        if (!instance) {
            throw new NotImplementedException(`Unsupported calendar provider: ${provider}`);
        }

        return instance;
    }
}
