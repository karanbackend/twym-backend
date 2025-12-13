import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { EmailType } from '../enums/email-type.const';
import { EMAIL_TYPES } from '../enums/email-type.const';

export class ContactEmailResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the email',
    })
    id!: string;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Contact ID this email belongs to',
    })
    contact_id?: string | null;

    @ApiProperty({
        description: 'Email address',
        example: 'john.doe@example.com',
    })
    email!: string;

    @ApiPropertyOptional({
        description: 'Type of email address',
        enum: EMAIL_TYPES,
    })
    email_type?: EmailType | null;

    @ApiPropertyOptional({
        description: 'Whether this is the primary email',
    })
    is_primary?: boolean | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the email was created',
    })
    created_at?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the email was last updated',
    })
    updated_at?: Date | null;
}
