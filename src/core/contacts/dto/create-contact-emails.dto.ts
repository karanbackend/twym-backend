import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ContactEmailDto } from './create-contact.dto';

export class CreateContactEmailsDto {
    @ApiProperty({
        description: 'Array of email addresses to add to the contact',
        type: [ContactEmailDto],
        example: [
            {
                email: 'contact@example.com',
                email_type: 'work',
                is_primary: true,
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactEmailDto)
    items!: ContactEmailDto[];
}
