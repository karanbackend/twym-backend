import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EmailType } from '../types/email-type.const';
import { EMAIL_TYPES } from '../types/email-type.const';

export class ProfileEmailResponseDto {
    @ApiProperty({ format: 'uuid', description: 'Email record id' })
    id!: string;

    @ApiProperty({ format: 'uuid', description: 'Profile id' })
    profile_id!: string;

    @ApiProperty({ description: 'Email address' })
    email!: string;

    @ApiProperty({
        description: 'Email type',
        enum: EMAIL_TYPES,
    })
    email_type!: EmailType;

    @ApiPropertyOptional({
        description: 'Whether this is the primary email',
        type: Boolean,
        example: true,
    })
    is_primary?: boolean | null;

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
