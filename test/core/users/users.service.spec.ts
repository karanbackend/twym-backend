import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../../../src/core/users/users.service';
import { UsersRepository } from '../../../src/core/users/users.repository';
import { User } from '../../../src/core/users/entities/user.entity';

describe('UsersService', () => {
    let service: UsersService;
    let repository: jest.Mocked<UsersRepository>;

    const mockUser: User = {
        id: 'user-123',
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02'),
    } as User;

    beforeEach(async () => {
        const mockRepository = {
            findAll: jest.fn(),
            findById: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            create: jest.fn(),
            scheduleDeletion: jest.fn(),
            cancelDeletion: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [UsersService, { provide: UsersRepository, useValue: mockRepository }],
        }).compile();

        service = module.get<UsersService>(UsersService);
        // retrieve the mocked repository with a typed result to avoid unsafe `any` assignment
        repository = module.get<UsersRepository, jest.Mocked<UsersRepository>>(UsersRepository);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all users', async () => {
            const users = [mockUser, { ...mockUser, id: 'user-456' }] as User[];
            repository.findAll.mockResolvedValue(users);

            const result = await service.findAll();

            expect(result).toEqual(users);
            expect(repository.findAll).toHaveBeenCalled();
        });

        it('should return empty array if no users exist', async () => {
            repository.findAll.mockResolvedValue([]);

            const result = await service.findAll();

            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a user by id', async () => {
            repository.findById.mockResolvedValue(mockUser);

            const result = await service.findOne('user-123');

            expect(result).toEqual(mockUser);
            expect(repository.findById).toHaveBeenCalledWith('user-123');
        });

        it('should return null if user not found', async () => {
            repository.findById.mockResolvedValue(null);

            const result = await service.findOne('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a user', async () => {
            const updateDto = { email: 'newemail@example.com' };
            const updatedUser = { ...mockUser, ...updateDto } as User;

            repository.update.mockResolvedValue(updatedUser);

            const result = await service.update('user-123', updateDto);

            expect(result).toEqual(updatedUser);
            expect(repository.update).toHaveBeenCalledWith('user-123', updateDto);
        });
    });

    describe('remove', () => {
        it('should delete a user', async () => {
            repository.delete.mockResolvedValue(undefined);

            await service.remove('user-123');

            expect(repository.delete).toHaveBeenCalledWith('user-123');
        });
    });

    describe('ensureUserExists', () => {
        it('should return existing user if found', async () => {
            repository.findById.mockResolvedValue(mockUser);

            const result = await service.ensureUserExists('user-123');

            expect(result).toEqual(mockUser);
            expect(repository.findById).toHaveBeenCalledWith('user-123');
            expect(repository.create).not.toHaveBeenCalled();
        });

        it('should create new user if not found', async () => {
            repository.findById.mockResolvedValue(null);
            repository.create.mockResolvedValue(mockUser);

            const result = await service.ensureUserExists('user-123');

            expect(result).toEqual(mockUser);
            expect(repository.create).toHaveBeenCalled();
            const createArg = repository.create.mock.calls[0][0] as {
                id: string;
                createdAt: Date;
            };
            expect(createArg.id).toBe('user-123');
            expect(createArg.createdAt).toBeInstanceOf(Date);
        });

        it('should handle race condition when user created concurrently', async () => {
            repository.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(mockUser);
            repository.create.mockRejectedValue(new Error('Unique constraint violation'));

            const result = await service.ensureUserExists('user-123');

            expect(result).toEqual(mockUser);
            expect(repository.findById).toHaveBeenCalledTimes(2);
        });

        it('should throw error if user still not found after race condition', async () => {
            repository.findById.mockResolvedValue(null);
            repository.create.mockRejectedValue(new Error('Database error'));

            await expect(service.ensureUserExists('user-123')).rejects.toThrow(Error);
        });
    });

    describe('requestAccountDeletion', () => {
        it('should schedule account deletion with 30-day grace period', async () => {
            const now = new Date();
            const scheduledDate = new Date(now);
            scheduledDate.setUTCDate(scheduledDate.getUTCDate() + 30);

            const scheduledUser = {
                ...mockUser,
                deletionScheduledFor: scheduledDate,
                accountLocked: true,
            } as User;

            repository.scheduleDeletion.mockResolvedValue(scheduledUser);

            const result = await service.requestAccountDeletion('user-123');

            expect(result).toEqual(scheduledUser);
            expect(repository.scheduleDeletion).toHaveBeenCalledWith('user-123', expect.any(Date));

            // Verify the scheduled date is approximately 30 days from now
            const call = repository.scheduleDeletion.mock.calls[0][1];
            const diffDays = Math.floor((call.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            expect(diffDays).toBe(30);
        });
    });

    describe('cancelAccountDeletion', () => {
        it('should cancel scheduled account deletion', async () => {
            const cancelledUser = {
                ...mockUser,
                deletionScheduledFor: null,
                accountLocked: false,
            } as User;

            repository.cancelDeletion.mockResolvedValue(cancelledUser);

            const result = await service.cancelAccountDeletion('user-123');

            expect(result).toEqual(cancelledUser);
            expect(repository.cancelDeletion).toHaveBeenCalledWith('user-123');
        });
    });
});
