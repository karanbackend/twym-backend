import { Test, TestingModule } from '@nestjs/testing';
import { AccountController } from '../../../src/core/users/account.controller';
import { UsersService } from '../../../src/core/users/users.service';

describe('AccountController', () => {
    let controller: AccountController;
    let usersService: jest.Mocked<UsersService>;

    const mockUserId = 'user-123';
    const mockAuthUser = { id: mockUserId };

    const mockDeletionResponse = {
        message: 'Account deletion requested',
        user_id: mockUserId,
        scheduled_deletion_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    };

    const mockCancellationResponse = {
        message: 'Account deletion cancelled',
        user_id: mockUserId,
    };

    beforeEach(async () => {
        const mockUsersService = {
            requestAccountDeletion: jest.fn(),
            cancelAccountDeletion: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [AccountController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
            ],
        }).compile();

        controller = module.get<AccountController>(AccountController);
        usersService = module.get(UsersService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('requestDeletion', () => {
        it('should request account deletion for authenticated user', async () => {
            usersService.requestAccountDeletion.mockResolvedValue(mockDeletionResponse);

            const result = await controller.requestDeletion(mockAuthUser);

            expect(usersService.requestAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual(mockDeletionResponse);
            expect(result.message).toBe('Account deletion requested');
            expect(result.user_id).toBe(mockUserId);
        });

        it('should handle deletion request with scheduled date', async () => {
            const scheduledDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
            const responseWithDate = {
                ...mockDeletionResponse,
                scheduled_deletion_at: scheduledDate,
            };

            usersService.requestAccountDeletion.mockResolvedValue(responseWithDate);

            const result = await controller.requestDeletion(mockAuthUser);

            expect(usersService.requestAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result.scheduled_deletion_at).toEqual(scheduledDate);
        });

        it('should request deletion for different user', async () => {
            const differentUser = { id: 'user-456' };
            const differentResponse = {
                ...mockDeletionResponse,
                user_id: differentUser.id,
            };

            usersService.requestAccountDeletion.mockResolvedValue(differentResponse);

            const result = await controller.requestDeletion(differentUser);

            expect(usersService.requestAccountDeletion).toHaveBeenCalledWith(differentUser.id);
            expect(result.user_id).toBe(differentUser.id);
        });
    });

    describe('cancelDeletion', () => {
        it('should cancel account deletion for authenticated user', async () => {
            usersService.cancelAccountDeletion.mockResolvedValue(mockCancellationResponse);

            const result = await controller.cancelDeletion(mockAuthUser);

            expect(usersService.cancelAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual(mockCancellationResponse);
            expect(result.message).toBe('Account deletion cancelled');
            expect(result.user_id).toBe(mockUserId);
        });

        it('should cancel deletion for different user', async () => {
            const differentUser = { id: 'user-789' };
            const differentResponse = {
                ...mockCancellationResponse,
                user_id: differentUser.id,
            };

            usersService.cancelAccountDeletion.mockResolvedValue(differentResponse);

            const result = await controller.cancelDeletion(differentUser);

            expect(usersService.cancelAccountDeletion).toHaveBeenCalledWith(differentUser.id);
            expect(result.user_id).toBe(differentUser.id);
        });

        it('should handle cancellation within grace period', async () => {
            const cancellationWithDetails = {
                message: 'Account deletion cancelled',
                user_id: mockUserId,
                cancelled_at: new Date(),
                was_scheduled_for: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
            };

            usersService.cancelAccountDeletion.mockResolvedValue(cancellationWithDetails);

            const result = await controller.cancelDeletion(mockAuthUser);

            expect(usersService.cancelAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual(cancellationWithDetails);
        });
    });

    describe('integration scenarios', () => {
        it('should handle request and then cancel deletion sequence', async () => {
            // First request deletion
            usersService.requestAccountDeletion.mockResolvedValue(mockDeletionResponse);
            const requestResult = await controller.requestDeletion(mockAuthUser);
            expect(requestResult.message).toBe('Account deletion requested');

            // Then cancel deletion
            usersService.cancelAccountDeletion.mockResolvedValue(mockCancellationResponse);
            const cancelResult = await controller.cancelDeletion(mockAuthUser);
            expect(cancelResult.message).toBe('Account deletion cancelled');

            // Verify both services were called with correct user id
            expect(usersService.requestAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
            expect(usersService.cancelAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
        });

        it('should allow multiple deletion requests from same user', async () => {
            usersService.requestAccountDeletion.mockResolvedValue(mockDeletionResponse);

            await controller.requestDeletion(mockAuthUser);
            await controller.requestDeletion(mockAuthUser);

            expect(usersService.requestAccountDeletion).toHaveBeenCalledTimes(2);
            expect(usersService.requestAccountDeletion).toHaveBeenCalledWith(mockAuthUser.id);
        });
    });
});
