import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CalendarConnectionRepository } from '../../../../src/common/calendar/repositories/calendar-connection.repository';
import { CalendarConnection } from '../../../../src/common/calendar/entities/calendar.entity';
import { CALENDAR_PROVIDERS } from '../../../../src/common/calendar/dto';

describe('CalendarConnectionRepository', () => {
    let repository: CalendarConnectionRepository;
    let mockRepository: jest.Mocked<Repository<CalendarConnection>>;

    beforeEach(async () => {
        const mockRepo = {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            increment: jest.fn(),
            createQueryBuilder: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CalendarConnectionRepository,
                {
                    provide: getRepositoryToken(CalendarConnection),
                    useValue: mockRepo,
                },
            ],
        }).compile();

        repository = module.get<CalendarConnectionRepository>(CalendarConnectionRepository);
        mockRepository = module.get(getRepositoryToken(CalendarConnection));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('findByUserId', () => {
        it('should find connection by user ID', async () => {
            const mockConnection = {
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                isActive: true,
            } as CalendarConnection;

            mockRepository.findOne.mockResolvedValue(mockConnection);

            const result = await repository.findByUserId('user-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { userId: 'user-123' },
            });
            expect(result).toEqual(mockConnection);
        });

        it('should return null if connection not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await repository.findByUserId('non-existent-user');

            expect(result).toBeNull();
        });
    });

    describe('findById', () => {
        it('should find connection by ID', async () => {
            const mockConnection = {
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                isActive: true,
            } as CalendarConnection;

            mockRepository.findOne.mockResolvedValue(mockConnection);

            const result = await repository.findById('connection-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'connection-123' },
            });
            expect(result).toEqual(mockConnection);
        });

        it('should return null if connection not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await repository.findById('non-existent-id');

            expect(result).toBeNull();
        });
    });

    describe('findExpiredTokens', () => {
        it('should find connections with expired tokens', async () => {
            const mockConnections = [
                {
                    id: 'connection-1',
                    userId: 'user-1',
                    provider: CALENDAR_PROVIDERS.GOOGLE,
                    isActive: true,
                    tokenExpiresAt: new Date(Date.now() - 1000),
                },
                {
                    id: 'connection-2',
                    userId: 'user-2',
                    provider: CALENDAR_PROVIDERS.MICROSOFT,
                    isActive: true,
                    tokenExpiresAt: new Date(Date.now() - 2000),
                },
            ] as CalendarConnection[];

            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue(mockConnections),
            };

            mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

            const result = await repository.findExpiredTokens();

            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('connection');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('connection.isActive = :isActive', {
                isActive: true,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'connection.tokenExpiresAt IS NOT NULL',
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'connection.tokenExpiresAt < :now',
                { now: expect.any(Date) },
            );
            expect(result).toEqual(mockConnections);
        });

        it('should return empty array if no expired tokens found', async () => {
            const mockQueryBuilder = {
                where: jest.fn().mockReturnThis(),
                andWhere: jest.fn().mockReturnThis(),
                getMany: jest.fn().mockResolvedValue([]),
            };

            mockRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);

            const result = await repository.findExpiredTokens();

            expect(result).toEqual([]);
        });
    });

    describe('create', () => {
        it('should create a new connection', async () => {
            const connectionData = {
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                calendarId: 'calendar-123',
                calendarName: 'My Calendar',
                isActive: true,
            };

            const createdConnection = {
                id: 'connection-123',
                ...connectionData,
                createdAt: new Date(),
                updatedAt: new Date(),
            } as CalendarConnection;

            mockRepository.create.mockReturnValue(createdConnection);
            mockRepository.save.mockResolvedValue(createdConnection);

            const result = await repository.create(connectionData);

            expect(mockRepository.create).toHaveBeenCalledWith(connectionData);
            expect(mockRepository.save).toHaveBeenCalledWith(createdConnection);
            expect(result).toEqual(createdConnection);
        });
    });

    describe('update', () => {
        it('should update a connection', async () => {
            const updateData = {
                calendarName: 'Updated Calendar',
                lastSyncedAt: new Date(),
            };

            const updatedConnection = {
                id: 'connection-123',
                userId: 'user-123',
                provider: CALENDAR_PROVIDERS.GOOGLE,
                calendarId: 'calendar-123',
                ...updateData,
            } as CalendarConnection;

            mockRepository.update.mockResolvedValue({ affected: 1 } as any);
            mockRepository.findOne.mockResolvedValue(updatedConnection);

            const result = await repository.update('connection-123', updateData);

            expect(mockRepository.update).toHaveBeenCalledWith('connection-123', updateData);
            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'connection-123' },
            });
            expect(result).toEqual(updatedConnection);
        });

        it('should throw error if connection not found after update', async () => {
            mockRepository.update.mockResolvedValue({ affected: 1 } as any);
            mockRepository.findOne.mockResolvedValue(null);

            await expect(
                repository.update('non-existent-id', { calendarName: 'Test' }),
            ).rejects.toThrow('CalendarConnection with id non-existent-id not found');
        });
    });

    describe('delete', () => {
        it('should delete a connection', async () => {
            mockRepository.delete.mockResolvedValue({ affected: 1 } as any);

            await repository.delete('connection-123');

            expect(mockRepository.delete).toHaveBeenCalledWith('connection-123');
        });
    });

    describe('incrementSyncFailureCount', () => {
        it('should increment sync failure count', async () => {
            mockRepository.increment.mockResolvedValue({ affected: 1 } as any);

            await repository.incrementSyncFailureCount('connection-123');

            expect(mockRepository.increment).toHaveBeenCalledWith(
                { id: 'connection-123' },
                'syncFailureCount',
                1,
            );
        });
    });

    describe('resetSyncFailureCount', () => {
        it('should reset sync failure count', async () => {
            mockRepository.update.mockResolvedValue({ affected: 1 } as any);

            await repository.resetSyncFailureCount('connection-123');

            expect(mockRepository.update).toHaveBeenCalledWith('connection-123', {
                syncFailureCount: 0,
            });
        });
    });
});
