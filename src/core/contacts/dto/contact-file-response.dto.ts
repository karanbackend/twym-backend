import { ApiProperty } from '@nestjs/swagger';

export class ContactFileResponseDto {
    @ApiProperty({
        format: 'uuid',
        description: 'Unique identifier for the contact file record',
    })
    id!: string;

    @ApiProperty({
        format: 'uuid',
        description: 'User file ID reference',
    })
    file_id!: string;
}
