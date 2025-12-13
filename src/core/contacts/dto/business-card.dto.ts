import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsIn, IsUUID } from 'class-validator';

export class UploadBusinessCardDto {
    @ApiPropertyOptional({
        description: 'Side of business card (front or back)',
        enum: ['front', 'back'],
        default: 'front',
        example: 'front',
    })
    @IsOptional()
    @IsIn(['front', 'back'], { message: 'side must be either front or back' })
    side?: 'front' | 'back';

    // Internal use only - populated from path parameter in controller
    @IsOptional()
    @IsUUID(4, { message: 'contact_id must be a valid UUID v4' })
    contact_id?: string;
}

export class BusinessCardResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'File ID',
    })
    file_id!: string;

    @ApiProperty({
        format: 'uuid',
        description: 'Contact file record ID',
    })
    contact_file_id!: string;

    @ApiProperty({
        description: 'URL to access the business card image',
        example: 'https://storage.example.com/cards/abc123.jpg',
    })
    file_url!: string;

    @ApiProperty({
        description: 'OCR processing status',
        enum: ['pending', 'processing', 'succeeded', 'failed'],
        example: 'succeeded',
    })
    processing_status!: string;

    @ApiPropertyOptional({
        description: 'Side of card (front or back)',
        enum: ['front', 'back'],
    })
    side?: string;

    @ApiPropertyOptional({
        description: 'Whether OCR results were found in cache (instant processing)',
        default: false,
    })
    cached?: boolean;

    @ApiPropertyOptional({
        description: 'Extracted contact information from the business card',
        example: {
            name: 'John Doe',
            title: 'Senior Engineer',
            company_name: 'Acme Corp',
            email: 'john@acme.com',
        },
    })
    extracted_data?: {
        name?: string;
        title?: string;
        company_name?: string;
        email?: string;
        phone?: string;
        address?: string;
    };
}
