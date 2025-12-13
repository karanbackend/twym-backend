import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { UserFileService } from '../../../src/core/users/user-file.service';
import { UserFileRepository } from '../../../src/core/users/user-file.repository';
import { STORAGE_SERVICE, IStorageService } from '../../../src/common/storage';
import type { UploadResult } from '../../../src/common/storage/interfaces/storage.interface';
import { FilePurpose } from '../../../src/core/users/entities/user-file.entity';

describe('UserFileService', () => {
    let service: UserFileService;
    let repository: jest.Mocked<UserFileRepository>;
    let storageService: jest.Mocked<IStorageService>;

    const mockUserId = 'user-123';
    const mockFile = {
        buffer: Buffer.from('test-file-content'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
    } as Express.Multer.File;

    beforeEach(async () => {
        const mockRepository = {
            create: jest.fn(),
            save: jest.fn(),
            findByOwnerIdAndPurpose: jest.fn(),
            softDelete: jest.fn(),
            deleteById: jest.fn(),
            findByOwnerId: jest.fn(),
        };

        const mockStorageService = {
            uploadFile: jest.fn(),
            deleteFile: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UserFileService,
                { provide: UserFileRepository, useValue: mockRepository },
                { provide: STORAGE_SERVICE, useValue: mockStorageService },
            ],
        }).compile();

        service = module.get<UserFileService>(UserFileService);
        repository = module.get<UserFileRepository, jest.Mocked<UserFileRepository>>(
            UserFileRepository,
        );
        storageService = module.get<unknown, jest.Mocked<IStorageService>>(STORAGE_SERVICE);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('uploadProfileImage', () => {
        it('should upload profile image successfully', async () => {
            const mockStorageResult: UploadResult = {
                filePath: 'user-123/profile-image-abc.jpg',
                publicUrl: 'https://storage.example.com/public-url',
                signedUrl: 'https://storage.example.com/signed-url',
            };

            const mockUserFile = {
                id: 'file-123',
                ownerId: mockUserId,
                fileUrl: mockStorageResult.signedUrl,
                purpose: FilePurpose.PROFILE_IMAGE,
            } as unknown as any;

            repository.findByOwnerIdAndPurpose.mockResolvedValue(null);
            storageService.uploadFile.mockResolvedValue(
                mockStorageResult as unknown as UploadResult,
            );
            repository.create.mockReturnValue(mockUserFile as unknown as any);
            repository.save.mockResolvedValue(mockUserFile as unknown as any);

            const result = await service.uploadProfileImage(mockUserId, mockFile);

            expect(result).toBeDefined();
            expect(result.id).toBe('file-123');
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                'public-profiles',
                mockUserId,
                mockFile,
                FilePurpose.PROFILE_IMAGE,
            );
        });

        it('should delete existing profile image before uploading new one', async () => {
            const existingFile = {
                id: 'old-file-123',
                ownerId: mockUserId,
                purpose: FilePurpose.PROFILE_IMAGE,
                storageBucket: 'public-profiles',
                storageObjectPath: 'user-123/old-profile-image.jpg',
            };

            const mockStorageResult: UploadResult = {
                filePath: 'user-123/profile-image-new.jpg',
                publicUrl: 'https://storage.example.com/new-public-url',
                signedUrl: 'https://storage.example.com/new-url',
            };

            const mockUserFile = {
                id: 'file-456',
                ownerId: mockUserId,
                fileUrl: mockStorageResult.signedUrl,
            } as unknown as any;

            repository.findByOwnerIdAndPurpose.mockResolvedValue(existingFile as any);
            repository.deleteById.mockResolvedValue(undefined);
            storageService.uploadFile.mockResolvedValue(
                mockStorageResult as unknown as UploadResult,
            );
            storageService.deleteFile.mockResolvedValue(undefined);
            repository.create.mockReturnValue(mockUserFile as unknown as any);
            repository.save.mockResolvedValue(mockUserFile as unknown as any);

            const result = await service.uploadProfileImage(mockUserId, mockFile);

            expect(result.id).toBe('file-456');
            expect(repository.deleteById).toHaveBeenCalledWith('old-file-123');
            expect(storageService.deleteFile).toHaveBeenCalled();
        });
    });

    describe('uploadCoverImage', () => {
        it('should upload cover image successfully', async () => {
            const mockStorageResult: UploadResult = {
                filePath: 'user-123/cover-image-abc.jpg',
                publicUrl: 'https://storage.example.com/cover-public-url',
                signedUrl: 'https://storage.example.com/cover-url',
            };

            const mockUserFile = {
                id: 'file-789',
                ownerId: mockUserId,
                fileUrl: mockStorageResult.signedUrl,
                purpose: FilePurpose.COVER_IMAGE,
            } as unknown as any;

            repository.findByOwnerIdAndPurpose.mockResolvedValue(null);
            storageService.uploadFile.mockResolvedValue(
                mockStorageResult as unknown as UploadResult,
            );
            repository.create.mockReturnValue(mockUserFile as unknown as any);
            repository.save.mockResolvedValue(mockUserFile as unknown as any);

            const result = await service.uploadCoverImage(mockUserId, mockFile);

            expect(result).toBeDefined();
            expect(result.id).toBe('file-789');
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                'public-profiles',
                mockUserId,
                mockFile,
                FilePurpose.COVER_IMAGE,
            );
        });
    });

    describe('uploadFile', () => {
        it('should upload file with custom purpose', async () => {
            const purpose = 'business_card';
            const sha256 = 'abc123hash';

            const mockStorageResult: UploadResult = {
                filePath: 'user-123/business_card-xyz.jpg',
                publicUrl: 'https://storage.example.com/file-public-url',
                signedUrl: 'https://storage.example.com/file-url',
            };

            const mockUserFile = {
                id: 'file-999',
                ownerId: mockUserId,
                fileUrl: mockStorageResult.signedUrl,
                purpose,
                sha256,
            } as unknown as any;

            storageService.uploadFile.mockResolvedValue(
                mockStorageResult as unknown as UploadResult,
            );
            repository.create.mockReturnValue(mockUserFile as unknown as any);
            repository.save.mockResolvedValue(mockUserFile as unknown as any);

            const result = await service.uploadFile(mockUserId, mockFile, purpose, sha256);

            expect(result).toBeDefined();
            expect(result.id).toBe('file-999');
            expect(storageService.uploadFile).toHaveBeenCalledWith(
                'public-profiles',
                mockUserId,
                mockFile,
                purpose,
            );
        });

        it('should handle upload errors', async () => {
            const purpose = 'document';

            storageService.uploadFile.mockRejectedValue(new Error('Storage error'));

            // Mock logger to suppress error logs
            const loggerErrorSpy = jest
                .spyOn((service as any).logger, 'error')
                .mockImplementation();

            await expect(service.uploadFile(mockUserId, mockFile, purpose)).rejects.toThrow(
                InternalServerErrorException,
            );

            loggerErrorSpy.mockRestore();
        });

        it('should upload file without sha256 hash', async () => {
            const purpose = 'document';

            const mockStorageResult: UploadResult = {
                filePath: 'user-123/document-xyz.jpg',
                publicUrl: 'https://storage.example.com/doc-public-url',
                signedUrl: 'https://storage.example.com/file-url',
            };

            const mockUserFile = {
                id: 'file-111',
                ownerId: mockUserId,
                fileUrl: mockStorageResult.signedUrl,
                purpose,
                sha256: null,
            } as unknown as any;

            storageService.uploadFile.mockResolvedValue(
                mockStorageResult as unknown as UploadResult,
            );
            repository.create.mockReturnValue(mockUserFile as unknown as any);
            repository.save.mockResolvedValue(mockUserFile as unknown as any);

            const result = await service.uploadFile(mockUserId, mockFile, purpose);

            expect(result).toBeDefined();
            expect(result.id).toBe('file-111');
        });
    });
});
