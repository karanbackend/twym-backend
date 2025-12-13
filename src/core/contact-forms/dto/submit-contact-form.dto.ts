import { IsObject, IsString, IsOptional, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitContactFormDto {
    @ApiProperty({
        description: 'Submitted key-value pairs from the contact form',
        example: {
            name: 'John Doe',
            email: 'john@example.com',
            message: 'Hi!',
        },
    })
    @IsObject()
    @IsNotEmpty()
    submissionData: Record<string, any>;

    @ApiPropertyOptional({
        description: 'Visitor IP address',
        example: '203.0.113.42',
    })
    @IsString()
    @IsOptional()
    visitorIp?: string;

    @ApiPropertyOptional({ description: 'Visitor user agent string' })
    @IsString()
    @IsOptional()
    userAgent?: string;

    @ApiPropertyOptional({ description: 'Referrer URL' })
    @IsString()
    @IsOptional()
    referrer?: string;

    @ApiPropertyOptional({
        description: 'Whether CAPTCHA verification succeeded',
        default: false,
    })
    @IsBoolean()
    @IsOptional()
    captchaVerified?: boolean;
}
