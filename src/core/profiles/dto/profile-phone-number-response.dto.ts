import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { PhoneNumberType } from '../types/phone-number-type.const';
import { PHONE_NUMBER_TYPES } from '../types/phone-number-type.const';

export class ProfilePhoneNumberResponseDto {
    @ApiProperty({ format: 'uuid', description: 'Phone record id' })
    id!: string;

    @ApiProperty({ format: 'uuid', description: 'Profile id' })
    profile_id!: string;

    @ApiProperty({
        description: 'Phone number type',
        enum: PHONE_NUMBER_TYPES,
    })
    number_type!: PhoneNumberType;

    @ApiProperty({ description: 'Raw full number string' })
    raw_number!: string;

    @ApiPropertyOptional({
        description: 'Country code',
        type: String,
        example: '+1',
    })
    country_code?: string | null;

    @ApiPropertyOptional({
        description: 'Area code',
        type: String,
        example: '212',
    })
    area_code?: string | null;

    @ApiPropertyOptional({
        description: 'Local number portion',
        type: String,
        example: '5551234',
    })
    local_number?: string | null;

    @ApiPropertyOptional({
        description: 'Extension',
        type: String,
        example: '123',
    })
    extension?: string | null;

    @ApiPropertyOptional({
        description: 'Whether this is the primary number',
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
