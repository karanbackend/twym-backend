import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class ToggleProfileVisibilityDto {
    @ApiProperty({
        description:
            'Whether the profile should be publicly visible. Public = anyone with link can view, Private = only owner can view.',
        example: true,
    })
    @IsBoolean({ message: 'is_public must be a boolean' })
    is_public!: boolean;
}
