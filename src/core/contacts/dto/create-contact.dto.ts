import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsArray,
    IsBoolean,
    IsDateString,
    IsIn,
    IsOptional,
    IsString,
    IsUUID,
    MaxLength,
    ArrayMaxSize,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import type {
    ContactType,
    AcquiredVia,
    ScannedType,
    PhoneNumberType,
    EmailType,
    AddressType,
    LinkType,
} from '../enums';
import { CONTACT_TYPES, ACQUIRED_VIA_VALUES, SCANNED_TYPES } from '../enums';

export class ContactPhoneNumberDto {
    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Phone record ID',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiProperty({
        type: String,
        description: 'Type of phone number',
        enum: ['work', 'mobile', 'fax', 'home'],
        example: 'mobile',
    })
    @IsString({ message: 'number_type must be a string' })
    number_type!: PhoneNumberType;

    @ApiProperty({
        type: String,
        description: 'Raw phone number',
        example: '+1 (555) 123-4567',
    })
    @IsString({ message: 'raw_number must be a string' })
    @MaxLength(50, { message: 'raw_number cannot exceed 50 characters' })
    raw_number!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Country code',
        example: '+1',
    })
    @IsOptional()
    @IsString({ message: 'country_code must be a string' })
    @MaxLength(10, { message: 'country_code cannot exceed 10 characters' })
    country_code?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Area code',
        example: '555',
    })
    @IsOptional()
    @IsString({ message: 'area_code must be a string' })
    @MaxLength(10, { message: 'area_code cannot exceed 10 characters' })
    area_code?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Local number',
        example: '1234567',
    })
    @IsOptional()
    @IsString({ message: 'local_number must be a string' })
    @MaxLength(20, { message: 'local_number cannot exceed 20 characters' })
    local_number?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Extension',
        example: '123',
    })
    @IsOptional()
    @IsString({ message: 'extension must be a string' })
    @MaxLength(10, { message: 'extension cannot exceed 10 characters' })
    extension?: string | null;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Is primary number',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_primary must be a boolean' })
    is_primary?: boolean;
}

export class ContactEmailDto {
    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Email record ID',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiProperty({
        type: String,
        description: 'Email address',
        example: 'contact@example.com',
    })
    @IsString({ message: 'email must be a string' })
    email!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Type of email',
        enum: ['work', 'personal', 'other'],
        default: 'work',
    })
    @IsOptional()
    @IsString({ message: 'email_type must be a string' })
    email_type?: EmailType;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Is primary email',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_primary must be a boolean' })
    is_primary?: boolean;
}

export class ContactAddressDto {
    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Address record ID',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiProperty({
        type: String,
        description: 'Complete address',
        example: '456 Business Ave, New York, NY 10001',
    })
    @IsString({ message: 'raw_address must be a string' })
    @MaxLength(500, { message: 'raw_address cannot exceed 500 characters' })
    raw_address!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Street number',
        example: '456',
    })
    @IsOptional()
    @IsString({ message: 'street_number must be a string' })
    @MaxLength(50, { message: 'street_number cannot exceed 50 characters' })
    street_number?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Street name',
        example: 'Business Ave',
    })
    @IsOptional()
    @IsString({ message: 'street_name must be a string' })
    @MaxLength(200, { message: 'street_name cannot exceed 200 characters' })
    street_name?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Unit/Suite',
        example: 'Floor 5',
    })
    @IsOptional()
    @IsString({ message: 'unit_suite must be a string' })
    @MaxLength(100, { message: 'unit_suite cannot exceed 100 characters' })
    unit_suite?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'City',
        example: 'New York',
    })
    @IsOptional()
    @IsString({ message: 'city must be a string' })
    @MaxLength(100, { message: 'city cannot exceed 100 characters' })
    city?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'State/Province',
        example: 'NY',
    })
    @IsOptional()
    @IsString({ message: 'state_province must be a string' })
    @MaxLength(100, { message: 'state_province cannot exceed 100 characters' })
    state_province?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Postal code',
        example: '10001',
    })
    @IsOptional()
    @IsString({ message: 'postal_code must be a string' })
    @MaxLength(20, { message: 'postal_code cannot exceed 20 characters' })
    postal_code?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Country',
        example: 'USA',
    })
    @IsOptional()
    @IsString({ message: 'country must be a string' })
    @MaxLength(100, { message: 'country cannot exceed 100 characters' })
    country?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Type of address',
        enum: ['business', 'home', 'other'],
        default: 'business',
    })
    @IsOptional()
    @IsString({ message: 'address_type must be a string' })
    address_type?: AddressType;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Is primary address',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_primary must be a boolean' })
    is_primary?: boolean;
}

export class ContactLinkDto {
    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Link record ID',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Type of link',
        enum: ['website', 'social'],
        default: 'social',
    })
    @IsOptional()
    @IsString({ message: 'link_type must be a string' })
    link_type?: LinkType;

    @ApiProperty({
        type: String,
        description: 'Platform name',
        example: 'Twitter',
    })
    @IsString({ message: 'platform must be a string' })
    @MaxLength(100, { message: 'platform cannot exceed 100 characters' })
    platform!: string;

    @ApiProperty({
        type: String,
        description: 'URL',
        example: 'https://twitter.com/username',
    })
    @IsString({ message: 'url must be a string' })
    @MaxLength(500, { message: 'url cannot exceed 500 characters' })
    url!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Display name',
        example: '@username',
    })
    @IsOptional()
    @IsString({ message: 'display_name must be a string' })
    @MaxLength(200, { message: 'display_name cannot exceed 200 characters' })
    display_name?: string | null;

    @ApiPropertyOptional({
        type: Number,
        description: 'Sort order',
        default: 0,
    })
    @IsOptional()
    sort_order?: number | null;
}

export class CreateContactDto {
    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'User ID who owns this contact',
        example: '550e8400-e29b-41d4-a716-446655440000',
    })
    @IsOptional()
    @IsUUID(4, { message: 'user_id must be a valid UUID v4' })
    user_id?: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Type of contact',
        enum: CONTACT_TYPES,
        default: 'external',
    })
    @IsOptional()
    @IsIn(CONTACT_TYPES, {
        message: `contact_type must be one of: ${CONTACT_TYPES.join(', ')}`,
    })
    contact_type?: ContactType;

    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'If contact is a Twym user, their user ID',
        example: '550e8400-e29b-41d4-a716-446655440002',
    })
    @IsOptional()
    @IsUUID(4, { message: 'linked_user_id must be a valid UUID v4' })
    linked_user_id?: string | null;

    @ApiProperty({
        type: String,
        description: 'Full name of the contact',
        example: 'Jane Smith',
    })
    @IsString({ message: 'name must be a string' })
    @MaxLength(255, { message: 'name cannot exceed 255 characters' })
    name!: string;

    @ApiPropertyOptional({
        type: String,
        description: 'Job title',
        example: 'Marketing Director',
    })
    @IsOptional()
    @IsString({ message: 'title must be a string' })
    @MaxLength(255, { message: 'title cannot exceed 255 characters' })
    title?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Department',
        example: 'Marketing',
    })
    @IsOptional()
    @IsString({ message: 'department must be a string' })
    @MaxLength(255, { message: 'department cannot exceed 255 characters' })
    department?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Company name',
        example: 'Tech Corp',
    })
    @IsOptional()
    @IsString({ message: 'company_name must be a string' })
    @MaxLength(255, { message: 'company_name cannot exceed 255 characters' })
    company_name?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'About me / bio text',
        example: 'Experienced marketing professional...',
    })
    @IsOptional()
    @IsString({ message: 'about_me must be a string' })
    @MaxLength(2000, { message: 'about_me cannot exceed 2000 characters' })
    about_me?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'URL to profile image',
        example: 'https://example.com/profile.jpg',
    })
    @IsOptional()
    @IsString({ message: 'profile_image_url must be a string' })
    @MaxLength(500, {
        message: 'profile_image_url cannot exceed 500 characters',
    })
    profile_image_url?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'How this contact was acquired',
        enum: ACQUIRED_VIA_VALUES,
        default: 'manual',
    })
    @IsOptional()
    @IsIn(ACQUIRED_VIA_VALUES, {
        message: `acquired_via must be one of: ${ACQUIRED_VIA_VALUES.join(', ')}`,
    })
    acquired_via?: AcquiredVia;

    @ApiPropertyOptional({
        type: String,
        description: 'If acquired via scanning, the type of scan',
        enum: SCANNED_TYPES,
    })
    @IsOptional()
    @IsIn(SCANNED_TYPES, {
        message: `scanned_type must be one of: ${SCANNED_TYPES.join(', ')}`,
    })
    scanned_type?: ScannedType | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Timestamp when contact was acquired',
        example: '2025-01-15T10:30:00Z',
    })
    @IsOptional()
    @IsDateString({}, { message: 'acquired_at must be a valid date string' })
    acquired_at?: string | null;

    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Event ID if acquired at an event',
        example: '550e8400-e29b-41d4-a716-446655440001',
    })
    @IsOptional()
    @IsUUID(4, { message: 'event_id must be a valid UUID v4' })
    event_id?: string | null;

    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Lounge session ID if acquired in a lounge',
    })
    @IsOptional()
    @IsUUID(4, { message: 'lounge_session_id must be a valid UUID v4' })
    lounge_session_id?: string | null;

    @ApiPropertyOptional({
        type: String,
        format: 'uuid',
        description: 'Contact submission ID if acquired via form',
    })
    @IsOptional()
    @IsUUID(4, { message: 'contact_submission_id must be a valid UUID v4' })
    contact_submission_id?: string | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Private notes about this contact',
        example: 'Met at conference. Interested in partnership.',
    })
    @IsOptional()
    @IsString({ message: 'meeting_notes must be a string' })
    @MaxLength(5000, { message: 'meeting_notes cannot exceed 5000 characters' })
    meeting_notes?: string | null;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Whether this contact is marked as favorite',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_favorite must be a boolean' })
    is_favorite?: boolean | null;

    @ApiPropertyOptional({
        type: Boolean,
        description: 'Whether this contact is pinned to top',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_pinned must be a boolean' })
    is_pinned?: boolean | null;

    @ApiPropertyOptional({
        type: [String],
        description: 'System-generated tags',
        example: ['QR Scan', 'Event Badge'],
    })
    @IsOptional()
    @IsArray({ message: 'automatic_tags must be an array' })
    @IsString({ each: true, message: 'each automatic tag must be a string' })
    automatic_tags?: string[] | null;

    @ApiPropertyOptional({
        type: [String],
        description: 'User-defined tags (max 100)',
        example: ['prospect', 'vip', 'follow-up'],
    })
    @IsOptional()
    @IsArray({ message: 'user_tags must be an array' })
    @ArrayMaxSize(100, { message: 'user_tags cannot exceed 100 items' })
    @IsString({ each: true, message: 'each user tag must be a string' })
    @MaxLength(32, {
        each: true,
        message: 'each user tag cannot exceed 32 characters',
    })
    user_tags?: string[] | null;

    @ApiPropertyOptional({
        type: String,
        description: 'Hash for duplicate detection',
    })
    @IsOptional()
    @IsString({ message: 'contact_hash must be a string' })
    contact_hash?: string | null;

    @ApiPropertyOptional({
        type: [ContactPhoneNumberDto],
        description: 'Array of phone numbers',
    })
    @IsOptional()
    @IsArray({ message: 'phone_numbers must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactPhoneNumberDto)
    phone_numbers?: ContactPhoneNumberDto[] | null;

    @ApiPropertyOptional({
        type: [ContactEmailDto],
        description: 'Array of email addresses',
    })
    @IsOptional()
    @IsArray({ message: 'emails must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactEmailDto)
    emails?: ContactEmailDto[] | null;

    @ApiPropertyOptional({
        type: [ContactAddressDto],
        description: 'Array of physical addresses',
    })
    @IsOptional()
    @IsArray({ message: 'addresses must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactAddressDto)
    addresses?: ContactAddressDto[] | null;

    @ApiPropertyOptional({
        type: [ContactLinkDto],
        description: 'Array of links (social media, websites)',
    })
    @IsOptional()
    @IsArray({ message: 'links must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactLinkDto)
    links?: ContactLinkDto[] | null;
}
