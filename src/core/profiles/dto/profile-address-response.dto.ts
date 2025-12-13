import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AddressType } from '../types/address-type.const';
import { ADDRESS_TYPES } from '../types/address-type.const';

export class ProfileAddressResponseDto {
    @ApiProperty({ format: 'uuid', description: 'Address record id' })
    id!: string;

    @ApiProperty({ format: 'uuid', description: 'Profile id' })
    profile_id!: string;

    @ApiProperty({ description: 'Raw formatted address' })
    raw_address!: string;

    @ApiPropertyOptional({
        description: 'Street / building number',
        type: String,
        example: '221B',
    })
    street_number?: string | null;

    @ApiPropertyOptional({
        description: 'Street name',
        type: String,
        example: 'Baker Street',
    })
    street_name?: string | null;

    @ApiPropertyOptional({
        description: 'Unit / suite',
        type: String,
        example: 'Apt 4',
    })
    unit_suite?: string | null;

    @ApiPropertyOptional({
        description: 'City',
        type: String,
        example: 'London',
    })
    city?: string | null;

    @ApiPropertyOptional({
        description: 'State / province',
        type: String,
        example: 'Greater London',
    })
    state_province?: string | null;

    @ApiPropertyOptional({
        description: 'Postal / ZIP code',
        type: String,
        example: 'NW1',
    })
    postal_code?: string | null;

    @ApiPropertyOptional({
        description: 'Country',
        type: String,
        example: 'UK',
    })
    country?: string | null;

    @ApiPropertyOptional({
        description: 'Address type',
        enum: ADDRESS_TYPES,
    })
    address_type?: AddressType;

    @ApiPropertyOptional({
        description: 'Whether this is the primary address',
        type: Boolean,
        example: false,
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
