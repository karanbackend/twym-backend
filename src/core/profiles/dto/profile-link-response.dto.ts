import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { LinkType } from '../types';
import { LINK_TYPES } from '../types';

export class ProfileLinkResponseDto {
    @ApiProperty({ format: 'uuid', description: 'Link record id' })
    id!: string;

    @ApiProperty({ format: 'uuid', description: 'Profile id' })
    profile_id!: string;

    @ApiPropertyOptional({ description: 'Link type', enum: LINK_TYPES })
    link_type?: LinkType;

    @ApiProperty({
        description: 'Platform identifier (e.g. linkedin, twitter, website)',
    })
    platform!: string;

    @ApiProperty({ description: 'URL for the link' })
    url!: string;

    @ApiPropertyOptional({
        description: 'Display name for the link',
        type: String,
        example: 'Personal Website',
    })
    display_name?: string | null;

    @ApiPropertyOptional({
        description: 'Sort order',
        type: Number,
        example: 1,
    })
    sort_order?: number | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Record created at',
    })
    created_at?: Date;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Record updated at',
    })
    updated_at?: Date;
}
