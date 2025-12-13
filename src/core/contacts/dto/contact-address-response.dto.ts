import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AddressType } from '../enums/address-type.const';
import { ADDRESS_TYPES } from '../enums/address-type.const';

export class ContactAddressResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the address',
    })
    id!: string;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Contact ID this address belongs to',
    })
    contact_id?: string | null;

    @ApiProperty({
        description: 'Raw address as provided',
        example: '123 Main St, San Francisco, CA 94102',
    })
    raw_address!: string;

    @ApiPropertyOptional({
        description: 'Street number',
        example: '123',
    })
    street_number?: string | null;

    @ApiPropertyOptional({
        description: 'Street name',
        example: 'Main St',
    })
    street_name?: string | null;

    @ApiPropertyOptional({
        description: 'Unit or suite number',
        example: 'Suite 100',
    })
    unit_suite?: string | null;

    @ApiPropertyOptional({
        description: 'City name',
        example: 'San Francisco',
    })
    city?: string | null;

    @ApiPropertyOptional({
        description: 'State or province',
        example: 'CA',
    })
    state_province?: string | null;

    @ApiPropertyOptional({
        description: 'Postal or ZIP code',
        example: '94102',
    })
    postal_code?: string | null;

    @ApiPropertyOptional({
        description: 'Country name',
        example: 'United States',
    })
    country?: string | null;

    @ApiPropertyOptional({
        description: 'Type of address',
        enum: ADDRESS_TYPES,
    })
    address_type?: AddressType | null;

    @ApiPropertyOptional({
        description: 'Whether this is the primary address',
    })
    is_primary?: boolean | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the address was created',
    })
    created_at?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the address was last updated',
    })
    updated_at?: Date | null;
}
