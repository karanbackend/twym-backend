import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVCardPrivacyDto {
    @ApiPropertyOptional({
        description: 'Include profile photo in vCard',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'include_photo must be a boolean' })
    include_photo?: boolean;

    @ApiPropertyOptional({
        description: 'Include social/website links in vCard',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'include_social must be a boolean' })
    include_social?: boolean;

    @ApiPropertyOptional({
        description: 'Include physical addresses in vCard',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'include_address must be a boolean' })
    include_address?: boolean;
}
