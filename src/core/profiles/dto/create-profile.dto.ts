import {
    ArrayMaxSize,
    IsArray,
    IsBoolean,
    IsObject,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProfilePhoneNumberDto } from './profile-phone-number.dto';
import { ProfileEmailDto } from './profile-email.dto';
import { ProfileAddressDto } from './profile-address.dto';
import { ProfileLinkDto } from './profile-link.dto';

export class CreateProfileDto {
    @ApiProperty({
        format: 'uuid',
        description: 'User ID who owns this profile',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsUUID(4, { message: 'user_id must be a valid UUID v4' })
    user_id!: string;

    @ApiProperty({
        description: 'Full name of the profile owner',
        maxLength: 255,
        example: 'John Doe',
    })
    @IsString({ message: 'name must be a string' })
    @MaxLength(255, { message: 'name cannot exceed 255 characters' })
    name!: string;

    @ApiPropertyOptional({
        description: 'Job title or position',
        example: 'Senior Software Engineer',
    })
    @IsOptional()
    @IsString({ message: 'title must be a string' })
    @MaxLength(255, { message: 'title cannot exceed 255 characters' })
    title?: string | null;

    @ApiPropertyOptional({
        description: 'Department or team name',
        example: 'Engineering',
    })
    @IsOptional()
    @IsString({ message: 'department must be a string' })
    @MaxLength(255, { message: 'department cannot exceed 255 characters' })
    department?: string | null;

    @ApiPropertyOptional({
        description: 'Company or organization name',
        example: 'Acme Corporation',
    })
    @IsOptional()
    @IsString({ message: 'company_name must be a string' })
    @MaxLength(255, { message: 'company_name cannot exceed 255 characters' })
    company_name?: string | null;

    @ApiPropertyOptional({
        description: 'About me / bio text (max 2000 characters)',
        maxLength: 2000,
        example: 'Passionate software engineer with 10+ years of experience...',
    })
    @IsOptional()
    @IsString({ message: 'about_me must be a string' })
    @MaxLength(2000, { message: 'about_me cannot exceed 2000 characters' })
    about_me?: string | null;

    @ApiPropertyOptional({
        type: [String],
        description:
            'Profile tags for categorization (max 20 tags, 25 chars each). First 5-6 visible by default.',
        example: ['developer', 'speaker', 'open-source'],
    })
    @IsOptional()
    @IsArray({ message: 'profile_tags must be an array' })
    @ArrayMaxSize(20, { message: 'profile_tags cannot exceed 20 items' })
    @IsString({ each: true, message: 'each profile tag must be a string' })
    @MaxLength(25, {
        each: true,
        message: 'each profile tag cannot exceed 25 characters',
    })
    profile_tags?: string[] | null;

    @ApiPropertyOptional({
        default: true,
        description: 'Whether vCard download is enabled for this profile',
    })
    @IsOptional()
    @IsBoolean({ message: 'vcard_enabled must be a boolean' })
    vcard_enabled?: boolean | null;

    @ApiPropertyOptional({
        default: '4.0',
        description: 'vCard version (typically 3.0 or 4.0)',
        example: '4.0',
    })
    @IsOptional()
    @IsString({ message: 'vcard_version must be a string' })
    vcard_version?: string | null;

    @ApiPropertyOptional({
        description: 'vCard privacy settings controlling which fields are included',
        example: {
            include_phone: true,
            include_email: true,
            include_address: false,
        },
    })
    @IsOptional()
    @IsObject({ message: 'vcard_privacy_settings must be an object' })
    vcard_privacy_settings?: Record<string, any> | null;

    @ApiPropertyOptional({
        default: true,
        description: 'Whether this profile is publicly visible',
    })
    @IsOptional()
    @IsBoolean({ message: 'is_public must be a boolean' })
    is_public?: boolean | null;

    @ApiPropertyOptional({
        default: false,
        description: 'Whether contact capture form is enabled for this profile',
    })
    @IsOptional()
    @IsBoolean({ message: 'contact_capture_enabled must be a boolean' })
    contact_capture_enabled?: boolean | null;

    @ApiPropertyOptional({
        type: [ProfilePhoneNumberDto],
        description: 'Array of phone numbers associated with this profile',
    })
    @IsOptional()
    @IsArray({ message: 'phone_numbers must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfilePhoneNumberDto)
    phone_numbers?: ProfilePhoneNumberDto[] | null;

    @ApiPropertyOptional({
        type: [ProfileEmailDto],
        description: 'Array of email addresses associated with this profile',
    })
    @IsOptional()
    @IsArray({ message: 'emails must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfileEmailDto)
    emails?: ProfileEmailDto[] | null;

    @ApiPropertyOptional({
        type: [ProfileAddressDto],
        description: 'Array of physical addresses associated with this profile',
    })
    @IsOptional()
    @IsArray({ message: 'addresses must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfileAddressDto)
    addresses?: ProfileAddressDto[] | null;

    @ApiPropertyOptional({
        type: [ProfileLinkDto],
        description: 'Array of links (social media, websites) associated with this profile',
    })
    @IsOptional()
    @IsArray({ message: 'links must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfileLinkDto)
    links?: ProfileLinkDto[] | null;
}
