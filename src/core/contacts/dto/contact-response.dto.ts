import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContactPhoneNumberResponseDto } from './contact-phone-number-response.dto';
import { ContactEmailResponseDto } from './contact-email-response.dto';
import { ContactAddressResponseDto } from './contact-address-response.dto';
import { ContactLinkResponseDto } from './contact-link-response.dto';
import { ContactFileResponseDto } from './contact-file-response.dto';
import type { ContactType, AcquiredVia, ScannedType } from '../enums';
import { CONTACT_TYPES, ACQUIRED_VIA_VALUES, SCANNED_TYPES } from '../enums';

/**
 * Complete contact response with all nested data
 */
export class ContactResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the contact',
    })
    id!: string;

    @ApiProperty({
        format: 'uuid',
        description: 'User ID who owns this contact',
    })
    owner_id!: string;

    @ApiProperty({
        description: 'Type of contact',
        enum: CONTACT_TYPES,
    })
    contact_type!: ContactType;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'If contact is a Twym user, their user ID (for twym_user contact type)',
    })
    linked_user_id?: string | null;

    @ApiPropertyOptional({ description: 'Full name of the contact' })
    name?: string | null;

    @ApiPropertyOptional({ description: 'Job title' })
    title?: string | null;

    @ApiPropertyOptional({ description: 'Department' })
    department?: string | null;

    @ApiPropertyOptional({ description: 'Company name' })
    company_name?: string | null;

    @ApiPropertyOptional({ description: 'About me / bio text' })
    about_me?: string | null;

    @ApiPropertyOptional({ description: 'URL to profile image' })
    profile_image_url?: string | null;

    @ApiProperty({
        description: 'How this contact was acquired',
        enum: ACQUIRED_VIA_VALUES,
    })
    acquired_via!: AcquiredVia;

    @ApiPropertyOptional({
        description:
            'If acquired via scanning, the type of scan (required when acquired_via is scanned)',
        enum: SCANNED_TYPES,
    })
    scanned_type?: ScannedType | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the contact was acquired',
    })
    acquired_at?: Date | null;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Event ID if acquired at an event',
    })
    event_id?: string | null;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Lounge session ID if acquired in a lounge',
    })
    lounge_session_id?: string | null;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Contact submission ID if acquired via contact capture form',
    })
    contact_submission_id?: string | null;

    @ApiPropertyOptional({
        description: 'Private notes about the contact (US-C17)',
    })
    meeting_notes?: string | null;

    @ApiPropertyOptional({
        description: 'Whether this contact is marked as favorite (US-C15)',
    })
    is_favorite?: boolean | null;

    @ApiPropertyOptional({
        description: 'Whether this contact is pinned to the top (US-C16)',
    })
    is_pinned?: boolean | null;

    @ApiPropertyOptional({
        type: [String],
        description:
            'System-generated tags based on acquisition method (e.g., "QR Scan", "Event Badge")',
    })
    automatic_tags?: string[] | null;

    @ApiPropertyOptional({
        type: [String],
        description: 'User-defined custom tags for organizing contacts (US-C14, max 100 tags)',
    })
    user_tags?: string[] | null;

    @ApiPropertyOptional({
        description: 'Hash for duplicate detection based on name/email/phone (US-C19)',
    })
    contact_hash?: string | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the contact was created',
    })
    created_at?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the contact was last updated',
    })
    updated_at?: Date | null;

    @ApiPropertyOptional({
        type: () => ContactPhoneNumberResponseDto,
        isArray: true,
        description: 'Array of phone numbers associated with this contact',
    })
    phone_numbers!: ContactPhoneNumberResponseDto[];

    @ApiPropertyOptional({
        type: () => ContactEmailResponseDto,
        isArray: true,
        description: 'Array of email addresses associated with this contact',
    })
    emails!: ContactEmailResponseDto[];

    @ApiPropertyOptional({
        type: () => ContactAddressResponseDto,
        isArray: true,
        description: 'Array of addresses associated with this contact',
    })
    addresses!: ContactAddressResponseDto[];

    @ApiPropertyOptional({
        type: () => ContactLinkResponseDto,
        isArray: true,
        description: 'Array of links (social media, websites) associated with this contact',
    })
    links!: ContactLinkResponseDto[];

    @ApiPropertyOptional({
        type: () => ContactFileResponseDto,
        isArray: true,
        description: 'Array of files (business cards, documents) associated with this contact',
    })
    files!: ContactFileResponseDto[];
}
