import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class ApiInfoResponseDto {
    @ApiProperty({
        description: 'API name',
        example: 'Twym Connect API',
    })
    @IsString({ message: 'name must be a string' })
    @IsNotEmpty({ message: 'name is required' })
    name!: string;

    @ApiProperty({
        description: 'API version',
        example: '0.0.11',
    })
    @IsString({ message: 'version must be a string' })
    @IsNotEmpty({ message: 'version is required' })
    version!: string;

    @ApiProperty({
        description: 'API description',
        example: 'Twym Connect backend API for managing profiles and user data',
    })
    @IsString({ message: 'description must be a string' })
    @IsNotEmpty({ message: 'description is required' })
    description!: string;

    @ApiProperty({
        description: 'Current environment (development, staging, production)',
        example: 'development',
    })
    @IsString({ message: 'environment must be a string' })
    @IsNotEmpty({ message: 'environment is required' })
    environment!: string;

    @ApiProperty({
        description: 'API documentation URL (Swagger UI)',
        example: 'http://localhost:3000/api/docs',
    })
    @IsString({ message: 'documentation must be a string' })
    @IsNotEmpty({ message: 'documentation is required' })
    documentation!: string;

    @ApiProperty({
        description: 'API base URL',
        example: 'http://localhost:3000/api/v1',
    })
    @IsString({ message: 'baseUrl must be a string' })
    @IsNotEmpty({ message: 'baseUrl is required' })
    baseUrl!: string;

    @ApiProperty({
        description: 'API health status',
        example: 'operational',
    })
    @IsString({ message: 'status must be a string' })
    @IsNotEmpty({ message: 'status is required' })
    status!: string;

    @ApiProperty({
        description: 'Server timestamp (ISO 8601 format)',
        example: '2025-11-16T10:30:00.000Z',
        type: 'string',
        format: 'date-time',
    })
    @IsString({ message: 'timestamp must be a string' })
    @IsNotEmpty({ message: 'timestamp is required' })
    timestamp!: string;
}
