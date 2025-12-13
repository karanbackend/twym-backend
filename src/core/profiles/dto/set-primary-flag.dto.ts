import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class SetPrimaryFlagDto {
    @ApiProperty({
        example: true,
        description: 'Set whether this item should be the primary/default one',
    })
    @IsNotEmpty({ message: 'isPrimary is required' })
    @IsBoolean({ message: 'isPrimary must be a boolean' })
    isPrimary!: boolean;
}
