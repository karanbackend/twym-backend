import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsIn, IsOptional, IsString } from 'class-validator';
import type { EmailType } from '../types';
import { EMAIL_TYPES } from '../types';

export class ProfileEmailDto {
    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Email record ID (optional for creating new records)',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiProperty({
        description: 'Email address',
        example: 'john.doe@example.com',
    })
    @IsEmail({}, { message: 'email must be a valid email address' })
    email!: string;

    @ApiPropertyOptional({
        description: 'Type of email address',
        enum: EMAIL_TYPES,
        default: 'work',
        example: 'work',
    })
    @IsOptional()
    @IsString({ message: 'email_type must be a string' })
    @IsIn(EMAIL_TYPES, {
        message: `email_type must be one of: ${EMAIL_TYPES.join(', ')}`,
    })
    email_type?: EmailType;

    @ApiPropertyOptional({
        description: 'Whether this is the primary email address',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_primary must be a boolean' })
    is_primary?: boolean | null;
}
