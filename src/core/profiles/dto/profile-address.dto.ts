import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import type { AddressType } from '../types';
import { ADDRESS_TYPES } from '../types';

export class ProfileAddressDto {
    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Address record ID (optional for creating new records)',
    })
    @IsOptional()
    @IsString({ message: 'id must be a string' })
    id?: string;

    @ApiProperty({
        description: 'Complete address as a single string',
        example: '123 Main St, Suite 100, San Francisco, CA 94102, USA',
    })
    @IsString({ message: 'raw_address must be a string' })
    @MaxLength(500, { message: 'raw_address cannot exceed 500 characters' })
    raw_address!: string;

    @ApiPropertyOptional({
        description: 'Street number',
        example: '123',
    })
    @IsOptional()
    @IsString({ message: 'street_number must be a string' })
    @MaxLength(50, { message: 'street_number cannot exceed 50 characters' })
    street_number?: string | null;

    @ApiPropertyOptional({
        description: 'Street name',
        example: 'Main Street',
    })
    @IsOptional()
    @IsString({ message: 'street_name must be a string' })
    @MaxLength(200, { message: 'street_name cannot exceed 200 characters' })
    street_name?: string | null;

    @ApiPropertyOptional({
        description: 'Unit, suite, or apartment number',
        example: 'Suite 100',
    })
    @IsOptional()
    @IsString({ message: 'unit_suite must be a string' })
    @MaxLength(100, { message: 'unit_suite cannot exceed 100 characters' })
    unit_suite?: string | null;

    @ApiPropertyOptional({
        description: 'City name',
        example: 'San Francisco',
    })
    @IsOptional()
    @IsString({ message: 'city must be a string' })
    @MaxLength(100, { message: 'city cannot exceed 100 characters' })
    city?: string | null;

    @ApiPropertyOptional({
        description: 'State or province',
        example: 'CA',
    })
    @IsOptional()
    @IsString({ message: 'state_province must be a string' })
    @MaxLength(100, { message: 'state_province cannot exceed 100 characters' })
    state_province?: string | null;

    @ApiPropertyOptional({
        description: 'Postal or ZIP code',
        example: '94102',
    })
    @IsOptional()
    @IsString({ message: 'postal_code must be a string' })
    @MaxLength(20, { message: 'postal_code cannot exceed 20 characters' })
    postal_code?: string | null;

    @ApiPropertyOptional({
        description: 'Country name',
        example: 'United States',
    })
    @IsOptional()
    @IsString({ message: 'country must be a string' })
    @MaxLength(100, { message: 'country cannot exceed 100 characters' })
    country?: string | null;

    @ApiPropertyOptional({
        description: 'Type of address',
        enum: ADDRESS_TYPES,
        default: 'business',
        example: 'business',
    })
    @IsOptional()
    @IsString({ message: 'address_type must be a string' })
    @IsIn(ADDRESS_TYPES, {
        message: `address_type must be one of: ${ADDRESS_TYPES.join(', ')}`,
    })
    address_type?: AddressType;

    @ApiPropertyOptional({
        description: 'Whether this is the primary address',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_primary must be a boolean' })
    is_primary?: boolean | null;
}
