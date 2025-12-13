import {
    BadRequestException,
    Injectable,
    InternalServerErrorException,
    Logger,
} from '@nestjs/common';
import { SupabaseService } from '../auth/supabase/supabase.service';
import { v4 as uuidv4 } from 'uuid';
import { IStorageService, UploadResult } from './interfaces/storage.interface';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * Supabase Storage Implementation
 * This is a concrete implementation of IStorageService using Supabase
 */
@Injectable()
export class SupabaseStorageService implements IStorageService {
    private readonly logger = new Logger(SupabaseStorageService.name);

    constructor(private readonly supabaseService: SupabaseService) {}

    async uploadFile(
        bucketName: string,
        userId: string,
        file: Express.Multer.File,
        filePrefix?: string,
    ): Promise<UploadResult> {
        // Validate file
        this.validateFile(file);

        // Enforce correct folder structure: userId MUST be first
        if (!userId) {
            throw new BadRequestException('Missing user ID for file path.');
        }

        // Generate file path
        const fileExtension = this.getFileExtension(file.originalname);
        const fileName = `${filePrefix || 'file'}-${uuidv4()}${fileExtension}`;

        // Build: userId/filename.ext
        const filePath = `${userId}/${fileName}`;

        // Admin client
        const supabase = this.supabaseService.getAdminClient();

        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(filePath, file.buffer, {
                contentType: file.mimetype,
                upsert: false,
            });

        if (error) {
            this.logger.error(`Supabase upload error: ${error.message}`);
            throw new InternalServerErrorException(
                `Failed to upload file to storage: ${error.message}`,
            );
        }

        // Generate public URL (public and signed). For private buckets use signedUrl.
        const publicUrl = await this.getPublicUrl(bucketName, data.path);

        // Create a signed URL valid for one year (365 days)
        const oneYearSeconds = 60 * 60 * 24 * 365;
        let signedUrl: string | undefined;
        try {
            const { data: signedData, error: signedError } = await supabase.storage
                .from(bucketName)
                .createSignedUrl(data.path, oneYearSeconds);

            if (signedError) {
                // Log and continue returning publicUrl if available
                this.logger.warn(
                    `Failed to create signed URL for ${data.path}: ${signedError.message}`,
                );
            } else {
                // signedData has shape { signedUrl: string }
                const maybeSignedUrl = (signedData as { signedUrl?: string } | null)?.signedUrl;
                if (maybeSignedUrl) {
                    signedUrl = maybeSignedUrl;
                }
            }
        } catch (e) {
            this.logger.warn(`Error creating signed URL: ${(e as Error).message}`);
        }

        return {
            filePath: data.path,
            publicUrl,
            signedUrl,
        };
    }

    async deleteFile(bucketName: string, filePath: string): Promise<void> {
        // normalize filePath
        const normalizedPath = (filePath ?? '').replace(/^\/+/, '');
        const supabase = this.supabaseService.getAdminClient();

        const { error } = await supabase.storage.from(bucketName).remove([normalizedPath]);

        if (error) {
            this.logger.warn(`Failed to delete file from storage: ${error.message}`);
            // Don't throw - we want to continue
        }
    }

    async getPublicUrl(
        bucketName: string,
        filePath: string,
        expiresInSeconds?: number,
    ): Promise<string> {
        const normalizedPath = (filePath ?? '').replace(/^\/+/, '');
        const supabase = this.supabaseService.getAdminClient();

        // If an expiration is provided, try to create a signed URL
        if (expiresInSeconds && expiresInSeconds > 0) {
            try {
                const { data, error } = await supabase.storage
                    .from(bucketName)
                    .createSignedUrl(normalizedPath, expiresInSeconds);
                if (error) {
                    this.logger.warn(
                        `Failed to create signed URL for ${normalizedPath}: ${error.message}`,
                    );
                } else {
                    const maybeSigned = (data as { signedUrl?: string } | null)?.signedUrl;
                    if (maybeSigned) {
                        return maybeSigned;
                    }
                }
            } catch (e) {
                this.logger.warn(`Error creating signed URL: ${(e as Error).message}`);
            }
        }

        // Fallback to public URL (may be empty for private buckets)
        try {
            const {
                data: { publicUrl },
            } = supabase.storage.from(bucketName).getPublicUrl(normalizedPath);
            return publicUrl;
        } catch (e) {
            this.logger.warn(
                `Failed to get public URL for ${normalizedPath}: ${(e as Error).message}`,
            );
            return '';
        }
    }

    private validateFile(file: Express.Multer.File): void {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new BadRequestException(
                `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            );
        }

        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
            throw new BadRequestException(
                `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
            );
        }
    }

    private getFileExtension(filename: string): string {
        const parts = filename.split('.');
        return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
    }
}
