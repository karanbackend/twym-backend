import {
    BadRequestException,
    Inject,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import type { IStorageService } from '../../common/storage';
import { STORAGE_SERVICE } from '../../common/storage';
import { UserFileRepository } from './user-file.repository';
import { FilePurpose } from './entities/user-file.entity';
import { UserFileMapper } from './user-file.mapper';
import { UploadUserFileResponseDto } from './dto/upload-user-file-response.dto';

const BUCKET_NAME = 'public-profiles';

@Injectable()
export class UserFileService {
    private readonly logger = new Logger(UserFileService.name);

    constructor(
        @Inject(STORAGE_SERVICE)
        private readonly storageService: IStorageService,
        private readonly userFileRepository: UserFileRepository,
    ) {}

    async uploadProfileImage(
        userId: string,
        file: Express.Multer.File,
    ): Promise<UploadUserFileResponseDto> {
        return this.uploadFileInternal(userId, file, FilePurpose.PROFILE_IMAGE);
    }

    async uploadCoverImage(
        userId: string,
        file: Express.Multer.File,
    ): Promise<UploadUserFileResponseDto> {
        return this.uploadFileInternal(userId, file, FilePurpose.COVER_IMAGE);
    }

    // Public method for business card and other uploads with hash
    async uploadFile(
        userId: string,
        file: Express.Multer.File,
        purpose: string,
        sha256?: string,
    ): Promise<UploadUserFileResponseDto> {
        try {
            // Upload to Supabase Storage
            const { filePath, signedUrl } = await this.storageService.uploadFile(
                BUCKET_NAME,
                userId,
                file,
                purpose,
            );

            // Create database record
            const userFile = this.userFileRepository.create({
                ownerId: userId,
                fileUrl: signedUrl,
                filename: file.originalname,
                mimeType: file.mimetype,
                sizeBytes: file.size,
                purpose,
                sha256: sha256 || null,
                storageBucket: BUCKET_NAME,
                storageObjectPath: filePath,
                metadata: {},
            });

            const saved = await this.userFileRepository.save(userFile);

            this.logger.log(`File uploaded successfully: ${purpose} for user ${userId}`);

            return UserFileMapper.mapToDto(saved);
        } catch (error) {
            this.logger.error(
                `Failed to upload file for user ${userId}: ${(error as Error).message}`,
            );
            throw new InternalServerErrorException('Failed to upload file');
        }
    }

    private async uploadFileInternal(
        userId: string,
        file: Express.Multer.File,
        purpose: string,
    ): Promise<UploadUserFileResponseDto> {
        // Delete existing file if any
        await this.deleteExistingFile(userId, purpose);
        return this.uploadFile(userId, file, purpose);
    }

    private async deleteExistingFile(userId: string, purpose: string): Promise<void> {
        const existingFile = await this.userFileRepository.findByOwnerIdAndPurpose(userId, purpose);

        if (existingFile) {
            try {
                // Delete from storage
                if (existingFile.storageObjectPath && existingFile.storageBucket) {
                    await this.storageService.deleteFile(
                        existingFile.storageBucket,
                        existingFile.storageObjectPath,
                    );
                }

                // Delete from database
                await this.userFileRepository.deleteById(existingFile.id);

                this.logger.log(`Deleted existing ${purpose} for user ${userId}`);
            } catch (error) {
                this.logger.warn(`Failed to delete existing file: ${(error as Error).message}`);
                // Continue with upload even if deletion fails
            }
        }
    }

    async getFilesByUserId(userId: string): Promise<UploadUserFileResponseDto[]> {
        const files = await this.userFileRepository.findByOwnerId(userId);
        return files.map((file) => UserFileMapper.mapToDto(file));
    }

    async deleteFile(fileId: string, userId: string): Promise<void> {
        const file = await this.userFileRepository.findById(fileId);

        if (!file) {
            throw new BadRequestException('File not found');
        }

        if (file.ownerId !== userId) {
            throw new BadRequestException('Unauthorized to delete this file');
        }

        try {
            // Delete from storage
            if (file.storageObjectPath && file.storageBucket) {
                await this.storageService.deleteFile(file.storageBucket, file.storageObjectPath);
            }

            // Delete from database
            await this.userFileRepository.deleteById(file.id);

            this.logger.log(`Deleted file ${fileId} for user ${userId}`);
        } catch (error) {
            this.logger.error(`Failed to delete file ${fileId}: ${(error as Error).message}`);
            throw new InternalServerErrorException('Failed to delete file');
        }
    }
}
