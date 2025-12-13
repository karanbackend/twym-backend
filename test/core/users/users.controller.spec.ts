import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from '../../../src/core/users/users.controller';
import { UsersService } from '../../../src/core/users/users.service';
import { UserFileService } from '../../../src/core/users/user-file.service';
import { UpdateUserDto } from '../../../src/core/users/dto/update-user.dto';
import { UploadUserFileResponseDto } from '../../../src/core/users/dto/upload-user-file-response.dto';

describe('UsersController', () => {
    let controller: UsersController;
    let usersService: jest.Mocked<UsersService>;
    let userFileService: jest.Mocked<UserFileService>;

    const mockUserId = 'user-123';
    const mockAuthUser = { id: mockUserId };

    const mockUser = {
        id: mockUserId,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe',
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(async () => {
        const mockUsersService = {
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        };

        const mockUserFileService = {
            getFilesByUserId: jest.fn(),
            deleteFile: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [UsersController],
            providers: [
                {
                    provide: UsersService,
                    useValue: mockUsersService,
                },
                {
                    provide: UserFileService,
                    useValue: mockUserFileService,
                },
            ],
        }).compile();

        controller = module.get<UsersController>(UsersController);
        usersService = module.get(UsersService);
        userFileService = module.get(UserFileService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('findAll', () => {
        it('should return an array of users', async () => {
            const users = [mockUser];
            usersService.findAll.mockResolvedValue(users);

            const result = await controller.findAll();

            expect(usersService.findAll).toHaveBeenCalled();
            expect(result).toEqual(users);
        });

        it('should return empty array when no users exist', async () => {
            usersService.findAll.mockResolvedValue([]);

            const result = await controller.findAll();

            expect(usersService.findAll).toHaveBeenCalled();
            expect(result).toEqual([]);
        });
    });

    describe('findOne', () => {
        it('should return a user by id', async () => {
            usersService.findOne.mockResolvedValue(mockUser);

            const result = await controller.findOne(mockUserId);

            expect(usersService.findOne).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(mockUser);
        });

        it('should handle user not found', async () => {
            usersService.findOne.mockResolvedValue(null);

            const result = await controller.findOne('non-existent-id');

            expect(usersService.findOne).toHaveBeenCalledWith('non-existent-id');
            expect(result).toBeNull();
        });
    });

    describe('update', () => {
        it('should update a user', async () => {
            const updateDto: UpdateUserDto = {
                first_name: 'Jane',
                last_name: 'Smith',
            };

            const updatedUser = { ...mockUser, ...updateDto };
            usersService.update.mockResolvedValue(updatedUser);

            const result = await controller.update(mockUserId, updateDto);

            expect(usersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
            expect(result).toEqual(updatedUser);
        });

        it('should update user with partial data', async () => {
            const updateDto: UpdateUserDto = {
                first_name: 'Jane',
            };

            const updatedUser = { ...mockUser, first_name: 'Jane' };
            usersService.update.mockResolvedValue(updatedUser);

            const result = await controller.update(mockUserId, updateDto);

            expect(usersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
            expect(result).toEqual(updatedUser);
        });

        it('should handle empty update dto', async () => {
            const updateDto: UpdateUserDto = {};

            usersService.update.mockResolvedValue(mockUser);

            const result = await controller.update(mockUserId, updateDto);

            expect(usersService.update).toHaveBeenCalledWith(mockUserId, updateDto);
            expect(result).toEqual(mockUser);
        });
    });

    describe('remove', () => {
        it('should delete a user', async () => {
            usersService.remove.mockResolvedValue(undefined);

            const result = await controller.remove(mockUserId);

            expect(usersService.remove).toHaveBeenCalledWith(mockUserId);
            expect(result).toBeUndefined();
        });
    });

    describe('getMyFiles', () => {
        it('should return user files', async () => {
            const mockFiles: UploadUserFileResponseDto[] = [
                {
                    id: 'file-1',
                    owner_id: mockUserId,
                    file_name: 'document.pdf',
                    file_url: 'https://example.com/document.pdf',
                    file_size: 1024,
                    mime_type: 'application/pdf',
                    storage_path: 'users/user-123/document.pdf',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
                {
                    id: 'file-2',
                    owner_id: mockUserId,
                    file_name: 'image.jpg',
                    file_url: 'https://example.com/image.jpg',
                    file_size: 2048,
                    mime_type: 'image/jpeg',
                    storage_path: 'users/user-123/image.jpg',
                    created_at: new Date(),
                    updated_at: new Date(),
                },
            ];

            userFileService.getFilesByUserId.mockResolvedValue(mockFiles);

            const result = await controller.getMyFiles(mockAuthUser);

            expect(userFileService.getFilesByUserId).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual(mockFiles);
            expect(result).toHaveLength(2);
        });

        it('should return empty array when user has no files', async () => {
            userFileService.getFilesByUserId.mockResolvedValue([]);

            const result = await controller.getMyFiles(mockAuthUser);

            expect(userFileService.getFilesByUserId).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual([]);
        });
    });

    describe('deleteFile', () => {
        const mockFileId = 'file-123';

        it('should delete a user file', async () => {
            userFileService.deleteFile.mockResolvedValue(undefined);

            const result = await controller.deleteFile(mockAuthUser, mockFileId);

            expect(userFileService.deleteFile).toHaveBeenCalledWith(mockFileId, mockAuthUser.id);
            expect(result).toBeUndefined();
        });

        it('should handle file deletion for different file ids', async () => {
            const differentFileId = 'file-456';
            userFileService.deleteFile.mockResolvedValue(undefined);

            const result = await controller.deleteFile(mockAuthUser, differentFileId);

            expect(userFileService.deleteFile).toHaveBeenCalledWith(
                differentFileId,
                mockAuthUser.id,
            );
            expect(result).toBeUndefined();
        });
    });
});
