import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserResponseDto } from '../../users/dto/user-response.dto';
import { ProfilePhoneNumberResponseDto } from './profile-phone-number-response.dto';
import { ProfileEmailResponseDto } from './profile-email-response.dto';
import { ProfileAddressResponseDto } from './profile-address-response.dto';
import { ProfileLinkResponseDto } from './profile-link-response.dto';

export class ProfileResponseDto {
    @ApiProperty({ format: 'uuid', description: 'Profile id' })
    id!: string;

    @ApiProperty({ format: 'uuid', description: 'Owner user id' })
    user_id!: string;

    @ApiPropertyOptional({
        type: () => UserResponseDto,
        description: 'Owner user object (optional)',
    })
    user?: UserResponseDto | null;

    @ApiProperty({ description: 'Full name' })
    name!: string;

    @ApiPropertyOptional({
        description: 'Job title',
        type: String,
        example: 'Senior Developer',
    })
    title?: string | null;

    @ApiPropertyOptional({
        description: 'Department or team',
        type: String,
        example: 'Engineering',
    })
    department?: string | null;

    @ApiPropertyOptional({
        description: 'Company name',
        type: String,
        example: 'Twym Labs',
    })
    company_name?: string | null;

    @ApiPropertyOptional({
        description: 'About / summary (max 2000 chars)',
        type: String,
        example: 'Building great connections.',
    })
    about_me?: string | null;

    @ApiPropertyOptional({
        type: [String],
        description: 'Profile tags',
        example: ['networking', 'tech'],
    })
    profile_tags?: string[] | null;

    @ApiPropertyOptional({
        description: 'Public handle (unique)',
        type: String,
        example: 'jane.doe',
    })
    profile_handle?: string | null;

    @ApiPropertyOptional({
        description: 'Deeplink slug (unique)',
        type: String,
        example: 'jane-doe',
    })
    deeplink_slug?: string | null;

    @ApiPropertyOptional({
        description: 'Profile image URL',
        type: String,
        example: 'https://cdn.example.com/images/jane.jpg',
    })
    profile_image_url?: string | null;

    @ApiPropertyOptional({
        description: 'Cover / banner image URL',
        type: String,
        example: 'https://cdn.example.com/images/jane-cover.jpg',
    })
    cover_image_url?: string | null;

    @ApiPropertyOptional({
        description: 'Profile QR code URL (dynamic, generated from request host)',
        type: String,
        example: 'https://api.example.com/api/v1/profiles/qr/jane.doe.png',
    })
    profile_qr_code_url?: string | null;

    @ApiPropertyOptional({
        description: 'vCard QR code URL (dynamic, generated from request host)',
        type: String,
        example: 'https://api.example.com/api/v1/profiles/qr/jane.doe.vcf.png',
    })
    vcard_qr_code_url?: string | null;

    @ApiPropertyOptional({
        description: 'Whether vCard download is enabled',
        type: Boolean,
        example: true,
    })
    vcard_enabled?: boolean | null;

    @ApiPropertyOptional({
        description: 'vCard version',
        type: String,
        example: '4.0',
    })
    vcard_version?: string | null;

    @ApiPropertyOptional({
        description: 'Timestamp when vCard was last generated',
        type: 'string',
        format: 'date-time',
    })
    vcard_last_generated?: Date | null;

    @ApiPropertyOptional({
        description: 'vCard privacy settings object',
        type: Object,
        example: { email: true, phone: false },
    })
    vcard_privacy_settings?: Record<string, any> | null;

    @ApiPropertyOptional({
        description: 'Whether profile is publicly visible',
        type: Boolean,
        example: true,
    })
    is_public?: boolean | null;

    @ApiPropertyOptional({
        description: 'Whether contact capture form is enabled',
        type: Boolean,
        example: true,
    })
    contact_capture_enabled?: boolean | null;

    @ApiPropertyOptional({
        type: () => ProfilePhoneNumberResponseDto,
        isArray: true,
        description: 'Phone numbers associated with the profile',
    })
    phone_numbers?: ProfilePhoneNumberResponseDto[] | null;

    @ApiPropertyOptional({
        type: () => ProfileEmailResponseDto,
        isArray: true,
        description: 'Emails associated with the profile',
    })
    emails?: ProfileEmailResponseDto[] | null;

    @ApiPropertyOptional({
        type: () => ProfileAddressResponseDto,
        isArray: true,
        description: 'Physical addresses associated with the profile',
    })
    addresses?: ProfileAddressResponseDto[] | null;

    @ApiPropertyOptional({
        type: () => ProfileLinkResponseDto,
        isArray: true,
        description: 'Social / website links associated with the profile',
    })
    links?: ProfileLinkResponseDto[] | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'When the profile was created',
    })
    created_at?: Date;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'When the profile was last updated',
    })
    updated_at?: Date;
}
