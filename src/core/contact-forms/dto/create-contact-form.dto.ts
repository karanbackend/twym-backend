import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateContactFormDto {
    @ApiProperty({ description: 'Name field label', default: 'Your Name' })
    @IsString()
    @MaxLength(255)
    name: string;

    @ApiProperty({ description: 'Email field label', default: 'Email' })
    @IsString()
    @MaxLength(255)
    email: string;

    @ApiProperty({ description: 'Phone field label', default: 'Phone' })
    @IsString()
    @MaxLength(255)
    phone: string;

    @ApiProperty({ description: 'Job Title field label', default: 'Job Title' })
    @IsString()
    @MaxLength(255)
    jobTitle: string;

    @ApiProperty({ description: 'Company field label', default: 'Company' })
    @IsString()
    @MaxLength(255)
    company: string;

    @ApiProperty({ description: 'Message field label', default: 'Message' })
    @IsString()
    @MaxLength(255)
    message: string;

    @ApiPropertyOptional({
        description: 'Whether the form is active',
        default: true,
    })
    @IsBoolean()
    @IsOptional()
    isActive?: boolean;
}
