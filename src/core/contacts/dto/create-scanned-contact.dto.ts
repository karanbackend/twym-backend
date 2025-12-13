import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn, IsUUID, IsArray, MaxLength } from 'class-validator';
import type { ScannedType, PhoneNumberType, EmailType, AddressType, LinkType } from '../enums';

export class CreateScannedContactDto {
    @ApiProperty({
        description: 'Type of scan (QR code or event badge)',
        enum: ['qr_code', 'event_badge'],
        example: 'qr_code',
    })
    @IsIn(['qr_code', 'event_badge'], {
        message: 'scanned_type must be either qr_code or event_badge',
    })
    scanned_type!: Exclude<ScannedType, 'business_card'>;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Event ID if scanned at an event',
    })
    @IsOptional()
    @IsUUID(4, { message: 'event_id must be a valid UUID v4' })
    event_id?: string | null;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Linked Twym user ID for QR code scans of registered users',
    })
    @IsOptional()
    @IsUUID(4, { message: 'linked_user_id must be a valid UUID v4' })
    linked_user_id?: string | null;

    @ApiProperty({
        description: 'Full name',
        example: 'Jane Smith',
    })
    @IsString({ message: 'name must be a string' })
    @MaxLength(255, { message: 'name cannot exceed 255 characters' })
    name!: string;

    @ApiPropertyOptional({
        description: 'Job title',
        example: 'Product Manager',
    })
    @IsOptional()
    @IsString({ message: 'title must be a string' })
    @MaxLength(255, { message: 'title cannot exceed 255 characters' })
    title?: string | null;

    @ApiPropertyOptional({
        description: 'Department',
        example: 'Product',
    })
    @IsOptional()
    @IsString({ message: 'department must be a string' })
    @MaxLength(255, { message: 'department cannot exceed 255 characters' })
    department?: string | null;

    @ApiPropertyOptional({
        description: 'Company name',
        example: 'Innovation Inc',
    })
    @IsOptional()
    @IsString({ message: 'company_name must be a string' })
    @MaxLength(255, { message: 'company_name cannot exceed 255 characters' })
    company_name?: string | null;

    @ApiPropertyOptional({
        description: 'About/bio text',
    })
    @IsOptional()
    @IsString({ message: 'about_me must be a string' })
    @MaxLength(2000, { message: 'about_me cannot exceed 2000 characters' })
    about_me?: string | null;

    @ApiPropertyOptional({
        description: 'Profile image URL',
    })
    @IsOptional()
    @IsString({ message: 'profile_image_url must be a string' })
    @MaxLength(500, {
        message: 'profile_image_url cannot exceed 500 characters',
    })
    profile_image_url?: string | null;

    @ApiPropertyOptional({
        description: 'Array of phone numbers',
        type: 'array',
        example: [{ number_type: 'mobile', raw_number: '+1 555-123-4567' }],
    })
    @IsOptional()
    @IsArray({ message: 'phone_numbers must be an array' })
    phone_numbers?: Array<{
        number_type: PhoneNumberType;
        raw_number: string;
        country_code?: string;
    }>;

    @ApiPropertyOptional({
        description: 'Array of email addresses',
        type: 'array',
        example: [{ email: 'jane@example.com', email_type: 'work' }],
    })
    @IsOptional()
    @IsArray({ message: 'emails must be an array' })
    emails?: Array<{
        email: string;
        email_type?: EmailType;
    }>;

    @ApiPropertyOptional({
        description: 'Array of physical addresses',
        type: 'array',
        example: [{ raw_address: '789 Event St, Boston, MA 02101' }],
    })
    @IsOptional()
    @IsArray({ message: 'addresses must be an array' })
    addresses?: Array<{
        raw_address: string;
        address_type?: AddressType;
    }>;

    @ApiPropertyOptional({
        description: 'Array of social links',
        type: 'array',
        example: [
            {
                platform: 'Twitter',
                url: 'https://twitter.com/jane',
                link_type: 'social',
            },
        ],
    })
    @IsOptional()
    @IsArray({ message: 'links must be an array' })
    links?: Array<{
        platform: string;
        url: string;
        link_type?: LinkType;
    }>;
}
