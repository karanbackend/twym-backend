import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProfileAddressDto } from './profile-address.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileAddressDto {
    @ApiProperty({
        description: 'Array of physical addresses to create for the profile',
        type: [ProfileAddressDto],
        example: [
            {
                raw_address: '123 Main St, San Francisco, CA 94102',
                address_type: 'business',
                is_primary: true,
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfileAddressDto)
    items!: ProfileAddressDto[];
}
