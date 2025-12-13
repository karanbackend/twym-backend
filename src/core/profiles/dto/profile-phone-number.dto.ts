import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { PhoneNumberType } from '../types';
import { PHONE_NUMBER_TYPES } from '../types';

export class ProfilePhoneNumberDto {
    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Phone record ID (optional for creating new records)',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiProperty({
        description: 'Type of phone number',
        enum: PHONE_NUMBER_TYPES,
        example: 'mobile',
    })
    @IsString({ message: 'number_type must be a string' })
    @IsIn(PHONE_NUMBER_TYPES, {
        message: `number_type must be one of: ${PHONE_NUMBER_TYPES.join(', ')}`,
    })
    number_type!: PhoneNumberType;

    @ApiProperty({
        description: 'Raw phone number as provided',
        example: '+1 (555) 123-4567',
    })
    @IsString({ message: 'raw_number must be a string' })
    @MaxLength(50, { message: 'raw_number cannot exceed 50 characters' })
    raw_number!: string;

    @ApiPropertyOptional({
        description: 'Country code (e.g., +1, +44)',
        example: '+1',
    })
    @IsOptional()
    @IsString({ message: 'country_code must be a string' })
    @MaxLength(10, { message: 'country_code cannot exceed 10 characters' })
    country_code?: string | null;

    @ApiPropertyOptional({
        description: 'Area code',
        example: '555',
    })
    @IsOptional()
    @IsString({ message: 'area_code must be a string' })
    @MaxLength(10, { message: 'area_code cannot exceed 10 characters' })
    area_code?: string | null;

    @ApiPropertyOptional({
        description: 'Local number portion',
        example: '1234567',
    })
    @IsOptional()
    @IsString({ message: 'local_number must be a string' })
    @MaxLength(20, { message: 'local_number cannot exceed 20 characters' })
    local_number?: string | null;

    @ApiPropertyOptional({
        description: 'Phone extension',
        example: '123',
    })
    @IsOptional()
    @IsString({ message: 'extension must be a string' })
    @MaxLength(10, { message: 'extension cannot exceed 10 characters' })
    extension?: string | null;

    @ApiPropertyOptional({
        description: 'Whether this is the primary phone number',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_primary must be a boolean' })
    is_primary?: boolean | null;
}
