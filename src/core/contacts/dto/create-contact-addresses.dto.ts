import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ContactAddressDto } from './create-contact.dto';

export class CreateContactAddressesDto {
    @ApiProperty({
        description: 'Array of physical addresses to add to the contact',
        type: [ContactAddressDto],
        example: [
            {
                raw_address: '456 Business Ave, New York, NY 10001',
                address_type: 'business',
                is_primary: true,
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactAddressDto)
    items!: ContactAddressDto[];
}
