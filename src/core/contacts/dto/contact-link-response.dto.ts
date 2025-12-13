import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LinkType } from '../enums/link-type.const';
import { LINK_TYPES } from '../enums/link-type.const';

export class ContactLinkResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the link',
    })
    id!: string;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Contact ID this link belongs to',
    })
    contact_id?: string | null;

    @ApiPropertyOptional({
        description: 'Type of link',
        enum: LINK_TYPES,
    })
    link_type?: LinkType | null;

    @ApiProperty({
        description: 'Platform name (e.g., LinkedIn, Twitter, Website)',
        example: 'LinkedIn',
    })
    platform!: string;

    @ApiProperty({
        description: 'Full URL to the profile or page',
        example: 'https://linkedin.com/in/johndoe',
    })
    url!: string;

    @ApiPropertyOptional({
        description: 'Display name for the link',
        example: 'John Doe - LinkedIn',
    })
    display_name?: string | null;

    @ApiPropertyOptional({
        description: 'Sort order for displaying multiple links',
        example: 0,
    })
    sort_order?: number | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the link was created',
    })
    created_at?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the link was last updated',
    })
    updated_at?: Date | null;
}
