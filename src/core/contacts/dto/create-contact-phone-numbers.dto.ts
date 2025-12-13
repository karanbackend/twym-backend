import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ContactPhoneNumberDto } from './create-contact.dto';

export class CreateContactPhoneNumbersDto {
    @ApiProperty({
        description: 'Array of phone numbers to add to the contact',
        type: [ContactPhoneNumberDto],
        example: [
            {
                number_type: 'mobile',
                raw_number: '+1 (555) 123-4567',
                is_primary: true,
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactPhoneNumberDto)
    items!: ContactPhoneNumberDto[];
}
