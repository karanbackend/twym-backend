import { Test, TestingModule } from '@nestjs/testing';
import { MicrosoftCalendarProvider } from '../../../../src/common/calendar/providers/microsoft-calendar.provider';
import { AppConfig } from '../../../../src/common/config/app.config';

describe('MicrosoftCalendarProvider', () => {
    let provider: MicrosoftCalendarProvider;
    let mockAppConfig: jest.Mocked<AppConfig>;
    let loggerErrorSpy: jest.SpyInstance;

    const mockMicrosoftConfig = {
        clientId: 'microsoft-client-id',
        clientSecret: 'microsoft-client-secret',
        tenantId: 'microsoft-tenant-id',
    };

    beforeEach(async () => {
        mockAppConfig = {
            calendar: {
                encryptionKey: 'test-encryption-key',
                google: {
                    clientId: 'google-client-id',
                    clientSecret: 'google-client-secret',
                },
                microsoft: mockMicrosoftConfig,
            },
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MicrosoftCalendarProvider,
                {
                    provide: AppConfig,
                    useValue: mockAppConfig,
                },
            ],
        }).compile();

        provider = module.get<MicrosoftCalendarProvider>(MicrosoftCalendarProvider);

        // Suppress expected error logs during tests
        loggerErrorSpy = jest.spyOn(provider['logger'], 'error').mockImplementation();
    });

    afterEach(() => {
        loggerErrorSpy.mockRestore();
        jest.clearAllMocks();
    });

    describe('exchangeCodeForTokens', () => {
        it('should successfully exchange authorization code for tokens', async () => {
            const mockResponse = {
                access_token: 'access-token-123',
                refresh_token: 'refresh-token-123',
                expires_in: 3600,
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            } as any);

            const result = await provider.exchangeCodeForTokens(
                'auth-code-123',
                'https://app.example.com/callback',
            );

            expect(result).toEqual({
                accessToken: 'access-token-123',
                refreshToken: 'refresh-token-123',
                expiresAt: expect.any(Date),
            });
            expect(global.fetch).toHaveBeenCalledWith(
                `https://login.microsoftonline.com/${mockMicrosoftConfig.tenantId}/oauth2/v2.0/token`,
                expect.objectContaining({
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                }),
            );
        });

        it('should throw error when token exchange fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                text: jest.fn().mockResolvedValue('Invalid authorization code'),
            } as any);

            await expect(
                provider.exchangeCodeForTokens('invalid-code', 'https://redirect.url'),
            ).rejects.toThrow('Failed to exchange authorization code');
        });
    });

    describe('refreshAccessToken', () => {
        it('should successfully refresh access token', async () => {
            const mockResponse = {
                access_token: 'new-access-token',
                refresh_token: 'new-refresh-token',
                expires_in: 3600,
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            } as any);

            const result = await provider.refreshAccessToken('refresh-token-123');

            expect(result).toEqual({
                accessToken: 'new-access-token',
                refreshToken: 'new-refresh-token',
                expiresAt: expect.any(Date),
            });
            expect(global.fetch).toHaveBeenCalledWith(
                `https://login.microsoftonline.com/${mockMicrosoftConfig.tenantId}/oauth2/v2.0/token`,
                expect.objectContaining({
                    method: 'POST',
                }),
            );
        });

        it('should throw error when token refresh fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                text: jest.fn().mockResolvedValue('Invalid refresh token'),
            } as any);

            await expect(provider.refreshAccessToken('invalid-refresh-token')).rejects.toThrow(
                'Failed to refresh token',
            );
        });
    });

    describe('fetchEvents', () => {
        it('should successfully fetch calendar events', async () => {
            const mockResponse = {
                value: [
                    {
                        id: 'event-1',
                        subject: 'Meeting 1',
                        bodyPreview: 'Description 1',
                        location: { displayName: 'Location 1' },
                        start: {
                            dateTime: '2024-06-01T10:00:00',
                            timeZone: 'UTC',
                        },
                        end: {
                            dateTime: '2024-06-01T11:00:00',
                            timeZone: 'UTC',
                        },
                        attendees: [
                            {
                                emailAddress: {
                                    address: 'attendee@example.com',
                                },
                            },
                        ],
                    },
                    {
                        id: 'event-2',
                        subject: 'Meeting 2',
                        start: {
                            dateTime: '2024-06-02T14:00:00',
                            timeZone: 'UTC',
                        },
                        end: {
                            dateTime: '2024-06-02T15:00:00',
                            timeZone: 'UTC',
                        },
                    },
                ],
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            } as any);

            const startDate = new Date('2024-01-01');
            const endDate = new Date('2024-12-31');
            const result = await provider.fetchEvents('access-token-123', startDate, endDate);

            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                id: 'event-1',
                summary: 'Meeting 1',
                description: 'Description 1',
                location: 'Location 1',
                startTime: new Date('2024-06-01T10:00:00Z'),
                endTime: new Date('2024-06-01T11:00:00Z'),
            });
            expect(result[0].attendees).toHaveLength(1);
            expect(result[0].attendees[0].email).toBe('attendee@example.com');
            expect(result[1].summary).toBe('Meeting 2');
            expect(result[1].attendees).toBeUndefined();
        });

        it('should return empty array when no events found', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue({ value: [] }),
            } as any);

            const result = await provider.fetchEvents('access-token-123', new Date(), new Date());

            expect(result).toEqual([]);
        });

        it('should throw error when fetching events fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                text: jest.fn().mockResolvedValue('Unauthorized'),
            } as any);

            await expect(
                provider.fetchEvents('invalid-token', new Date(), new Date()),
            ).rejects.toThrow('Failed to fetch events');
        });
    });

    describe('getCalendarInfo', () => {
        it('should successfully fetch calendar info', async () => {
            const mockResponse = {
                id: 'calendar-123',
                name: 'My Calendar',
            };

            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
                json: jest.fn().mockResolvedValue(mockResponse),
            } as any);

            const result = await provider.getCalendarInfo('access-token-123');

            expect(result).toEqual({
                id: 'calendar-123',
                name: 'My Calendar',
            });
            expect(global.fetch).toHaveBeenCalledWith(
                'https://graph.microsoft.com/v1.0/me/calendar',
                expect.objectContaining({
                    headers: {
                        Authorization: 'Bearer access-token-123',
                    },
                }),
            );
        });

        it('should throw error when fetching calendar info fails', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
                text: jest.fn().mockResolvedValue('Unauthorized'),
            } as any);

            await expect(provider.getCalendarInfo('invalid-token')).rejects.toThrow(
                'Failed to get calendar info',
            );
        });
    });

    describe('validateToken', () => {
        it('should return true for valid token', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: true,
            } as any);

            const result = await provider.validateToken('valid-token');

            expect(result).toBe(true);
        });

        it('should return false for invalid token', async () => {
            global.fetch = jest.fn().mockResolvedValue({
                ok: false,
            } as any);

            const result = await provider.validateToken('invalid-token');

            expect(result).toBe(false);
        });
    });
});
