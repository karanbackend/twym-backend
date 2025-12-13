import { IdempotencyService } from '../../../src/common/idempotency/idempotency.service';
import { CalendarService } from '../../../src/common/calendar/calendar.service';
import { CalendarProviderFactory } from '../../../src/common/calendar/providers';
import { CalendarConnectionRepository } from '../../../src/common/calendar/repositories/calendar-connection.repository';
// No event-contact repository under fetch-only design
// encryption util mocked elsewhere; not used directly in this spec

describe('CalendarService sync idempotency', () => {
    it('skips already imported events using idempotency keys', async () => {
        const providerFactory = {
            getProvider: () => ({
                fetchEvents: () =>
                    Promise.resolve([
                        {
                            id: 'a',
                            summary: 'A',
                            description: '',
                            startTime: new Date(),
                            endTime: new Date(),
                            location: '',
                            isAllDay: false,
                        },
                        {
                            id: 'b',
                            summary: 'B',
                            description: '',
                            startTime: new Date(),
                            endTime: new Date(),
                            location: '',
                            isAllDay: false,
                        },
                    ]),
                exchangeCodeForTokens: jest.fn(),
                refreshAccessToken: jest.fn(),
                getCalendarInfo: jest.fn(),
                validateToken: jest.fn(),
            }),
        } as unknown as CalendarProviderFactory;

        const connectionRepo = {
            findAllByUserId: jest.fn().mockResolvedValue([
                {
                    id: 'conn',
                    userId: 'user',
                    provider: 'google',
                    accessTokenEncrypted: 'enc',
                    isActive: true,
                },
            ]),
            update: jest.fn(),
            resetSyncFailureCount: jest.fn(),
        } as unknown as CalendarConnectionRepository;

        const idempotency = {
            seen: jest.fn((key: string) => Promise.resolve(key.includes(':a'))),
            mark: jest.fn(),
        } as unknown as IdempotencyService;

        const service = new CalendarService(providerFactory, connectionRepo, idempotency);

        const result = await service.sync('user', { forceRefresh: true });

        expect(idempotency.mark).not.toHaveBeenCalled();
        expect(result).toHaveLength(1);
        expect(result[0].externalEventId).toBe('b');
    });
});
