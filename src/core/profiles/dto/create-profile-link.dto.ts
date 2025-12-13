import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { ProfileLinkDto } from './profile-link.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProfileLinkDto {
    @ApiProperty({
        description: 'Array of links (social media profiles, websites) to create for the profile',
        type: [ProfileLinkDto],
        example: [
            {
                platform: 'LinkedIn',
                url: 'https://linkedin.com/in/johndoe',
                link_type: 'social',
            },
        ],
    })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => ProfileLinkDto)
    items!: ProfileLinkDto[];
}
