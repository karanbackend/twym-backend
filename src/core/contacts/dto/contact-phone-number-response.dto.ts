import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PhoneNumberType } from '../enums/phone-number-type.const';
import { PHONE_NUMBER_TYPES } from '../enums/phone-number-type.const';

export class ContactPhoneNumberResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the phone number',
    })
    id!: string;

    @ApiPropertyOptional({
        format: 'uuid',
        description: 'Contact ID this phone number belongs to',
    })
    contact_id?: string | null;

    @ApiProperty({
        description: 'Type of phone number',
        enum: PHONE_NUMBER_TYPES,
    })
    number_type!: PhoneNumberType;

    @ApiProperty({
        description: 'Raw phone number as provided',
        example: '+1 (555) 123-4567',
    })
    raw_number!: string;

    @ApiPropertyOptional({
        description: 'Country code extracted from phone number',
        example: '+1',
    })
    country_code?: string | null;

    @ApiPropertyOptional({
        description: 'Area code extracted from phone number',
        example: '555',
    })
    area_code?: string | null;

    @ApiPropertyOptional({
        description: 'Local number part',
        example: '1234567',
    })
    local_number?: string | null;

    @ApiPropertyOptional({
        description: 'Phone extension',
        example: '123',
    })
    extension?: string | null;

    @ApiPropertyOptional({
        description: 'Whether this is the primary phone number',
    })
    is_primary?: boolean | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the phone number was created',
    })
    created_at?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Timestamp when the phone number was last updated',
    })
    updated_at?: Date | null;
}
