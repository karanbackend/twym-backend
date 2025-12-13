import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProfilePhoneNumberDto } from './profile-phone-number.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfilePhoneNumberDto {
    @ApiProperty({
        description: 'Array of phone numbers to create for the profile',
        type: [ProfilePhoneNumberDto],
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
    @Type(() => ProfilePhoneNumberDto)
    items!: ProfilePhoneNumberDto[];
}
