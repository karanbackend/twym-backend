import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, IsUrl, MaxLength, Min } from 'class-validator';
import type { LinkType } from '../types';
import { LINK_TYPES } from '../types';

export class ProfileLinkDto {
    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Link record ID (optional for creating new records)',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiPropertyOptional({
        description: 'Type of link',
        enum: LINK_TYPES,
        default: 'social',
        example: 'social',
    })
    @IsOptional()
    @IsString({ message: 'link_type must be a string' })
    @IsIn(LINK_TYPES, {
        message: `link_type must be one of: ${LINK_TYPES.join(', ')}`,
    })
    link_type?: LinkType;

    @ApiProperty({
        description: 'Platform name (e.g., LinkedIn, Twitter, GitHub, Website)',
        example: 'LinkedIn',
    })
    @IsString({ message: 'platform must be a string' })
    @MaxLength(100, { message: 'platform cannot exceed 100 characters' })
    platform!: string;

    @ApiProperty({
        description: 'Full URL to the profile or page',
        example: 'https://linkedin.com/in/johndoe',
    })
    @IsUrl({}, { message: 'url must be a valid URL' })
    @MaxLength(500, { message: 'url cannot exceed 500 characters' })
    url!: string;

    @ApiPropertyOptional({
        description: 'Display name for the link',
        example: 'John Doe - LinkedIn',
    })
    @IsOptional()
    @IsString({ message: 'display_name must be a string' })
    @MaxLength(200, { message: 'display_name cannot exceed 200 characters' })
    display_name?: string | null;

    @ApiPropertyOptional({
        description: 'Sort order for displaying multiple links (0-based)',
        default: 0,
        example: 0,
    })
    @IsOptional()
    @IsInt({ message: 'sort_order must be an integer' })
    @Min(0, { message: 'sort_order must be at least 0' })
    sort_order?: number | null;
}
