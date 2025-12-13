import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDeleteDto {
    @ApiProperty({
        description: 'Array of record IDs to delete (bulk operation)',
        example: ['clxud6s12000008l5col8962a', 'clxud6s12000108l50a1g1d3b'],
        type: [String],
    })
    @IsArray({ message: 'ids must be an array' })
    @ArrayNotEmpty({ message: 'ids array cannot be empty' })
    @IsString({ each: true, message: 'each id must be a string' })
    ids!: string[];
}
