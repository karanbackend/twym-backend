import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ContactLinkDto } from './create-contact.dto';

export class CreateContactLinksDto {
    @ApiProperty({
        description: 'Array of links (social media, websites) to add to the contact',
        type: [ContactLinkDto],
        example: [
            {
                platform: 'LinkedIn',
                url: 'https://linkedin.com/in/contact',
                link_type: 'social',
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ContactLinkDto)
    items!: ContactLinkDto[];
}
