import { Test, TestingModule } from '@nestjs/testing';
import { CalendarProviderFactory } from '../../../../src/common/calendar/providers/calendar-provider.factory';
import { GoogleCalendarProvider } from '../../../../src/common/calendar/providers/google-calendar.provider';
import { MicrosoftCalendarProvider } from '../../../../src/common/calendar/providers/microsoft-calendar.provider';
import { CALENDAR_PROVIDERS } from '../../../../src/common/calendar/dto';

describe('CalendarProviderFactory', () => {
    let factory: CalendarProviderFactory;
    let googleProvider: GoogleCalendarProvider;
    let microsoftProvider: MicrosoftCalendarProvider;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalendarProviderFactory,
                {
                    provide: GoogleCalendarProvider,
                    useValue: {
                        exchangeCodeForTokens: jest.fn(),
                        refreshAccessToken: jest.fn(),
                        fetchEvents: jest.fn(),
                        getCalendarInfo: jest.fn(),
                        validateToken: jest.fn(),
                    },
                },
                {
                    provide: MicrosoftCalendarProvider,
                    useValue: {
                        exchangeCodeForTokens: jest.fn(),
                        refreshAccessToken: jest.fn(),
                        fetchEvents: jest.fn(),
                        getCalendarInfo: jest.fn(),
                        validateToken: jest.fn(),
                    },
                },
            ],
        }).compile();

        factory = module.get<CalendarProviderFactory>(CalendarProviderFactory);
        googleProvider = module.get<GoogleCalendarProvider>(GoogleCalendarProvider);
        microsoftProvider = module.get<MicrosoftCalendarProvider>(MicrosoftCalendarProvider);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be defined', () => {
        expect(factory).toBeDefined();
    });

    describe('getProvider', () => {
        it('should return GoogleCalendarProvider for google provider', () => {
            const result = factory.getProvider(CALENDAR_PROVIDERS.GOOGLE);

            expect(result).toBe(googleProvider);
        });

        it('should return MicrosoftCalendarProvider for microsoft provider', () => {
            const result = factory.getProvider(CALENDAR_PROVIDERS.MICROSOFT);

            expect(result).toBe(microsoftProvider);
        });

        it('should throw Error for invalid provider', () => {
            expect(() => factory.getProvider('invalid-provider' as any)).toThrow(Error);
        });

        it('should throw Error with correct message', () => {
            expect(() => factory.getProvider('unknown' as any)).toThrow(
                'Unsupported calendar provider',
            );
        });
    });
});
