import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProfileEmailDto } from './profile-email.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileEmailDto {
    @ApiProperty({
        description: 'Array of email addresses to create for the profile',
        type: [ProfileEmailDto],
        example: [
            {
                email: 'john.doe@example.com',
                email_type: 'work',
                is_primary: true,
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfileEmailDto)
    items!: ProfileEmailDto[];
}
