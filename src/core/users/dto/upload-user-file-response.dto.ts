import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';

export class UploadUserFileResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the file record',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID(4, { message: 'id must be a valid UUID v4' })
    @IsNotEmpty({ message: 'id is required' })
    id!: string;

    @ApiProperty({
        format: 'uuid',
        description: 'Owner ID who owns the file',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID(4, { message: 'ownerId must be a valid UUID v4' })
    @IsNotEmpty({ message: 'ownerId is required' })
    ownerId!: string;

    @ApiProperty({
        description: 'Public URL to access the file',
        example:
            'https://example.supabase.co/storage/v1/object/public/public-profiles/profiles/123e4567-e89b-12d3-a456-426614174000/profile-image.jpg',
    })
    @IsString({ message: 'fileUrl must be a string' })
    @IsNotEmpty({ message: 'fileUrl is required' })
    fileUrl!: string;

    @ApiProperty({
        description: 'Original file name',
        example: 'profile-photo.jpg',
        required: false,
    })
    @IsString({ message: 'filename must be a string' })
    @IsOptional()
    filename?: string | null;

    @ApiProperty({
        description: 'MIME type of the file',
        example: 'image/jpeg',
        required: false,
    })
    @IsString({ message: 'mimeType must be a string' })
    @IsOptional()
    mimeType?: string | null;

    @ApiProperty({
        description: 'File size in bytes',
        example: 102400,
        required: false,
    })
    @IsNumber({}, { message: 'sizeBytes must be a number' })
    @IsOptional()
    sizeBytes?: number | null;

    @ApiProperty({
        description: 'Purpose of the file (e.g., profile_image, business_card)',
        example: 'profile_image',
        required: false,
    })
    @IsString({ message: 'purpose must be a string' })
    @IsOptional()
    purpose?: string | null;

    @ApiProperty({
        description: 'SHA256 hash of the file for deduplication',
        example: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        required: false,
    })
    @IsString({ message: 'sha256 must be a string' })
    @IsOptional()
    sha256?: string | null;

    @ApiProperty({
        description: 'Storage bucket name where file is stored',
        example: 'public-profiles',
        required: false,
    })
    @IsString({ message: 'storageBucket must be a string' })
    @IsOptional()
    storageBucket?: string | null;

    @ApiProperty({
        description: 'Storage object path within the bucket',
        example: 'profiles/123e4567-e89b-12d3-a456-426614174000/profile-image.jpg',
        required: false,
    })
    @IsString({ message: 'storageObjectPath must be a string' })
    @IsOptional()
    storageObjectPath?: string | null;

    @ApiProperty({
        description: 'Additional metadata as key-value pairs',
        example: { width: 800, height: 600, format: 'jpeg' },
        required: false,
    })
    @IsOptional()
    metadata?: Record<string, any> | null;

    @ApiProperty({
        description: 'Timestamp when file was created',
        example: '2023-11-15T10:00:00Z',
        type: 'string',
        format: 'date-time',
    })
    createdAt?: Date;
}
