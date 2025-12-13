import { IsIn, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export const CALENDAR_PROVIDERS = {
    GOOGLE: 'google',
    MICROSOFT: 'microsoft',
} as const;

export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[keyof typeof CALENDAR_PROVIDERS];

export class ConnectCalendarDto {
    @ApiProperty({
        description: 'Calendar provider to connect',
        enum: Object.values(CALENDAR_PROVIDERS),
        example: 'google',
    })
    @IsIn(Object.values(CALENDAR_PROVIDERS))
    @IsNotEmpty()
    provider: CalendarProvider;

    @ApiProperty({
        description: 'Authorization code returned by the provider',
        example: '4/0AfJohX...',
    })
    @IsString()
    @IsNotEmpty()
    authorizationCode: string;

    @ApiProperty({
        description: 'Redirect URI used for the OAuth flow (optional if backend-controlled)',
        required: false,
    })
    @IsUrl()
    @IsOptional()
    redirectUri?: string;
}

export class CalendarTokensDto {
    @ApiProperty({ description: 'OAuth access token' })
    @IsString()
    @IsNotEmpty()
    accessToken: string;

    @ApiProperty({
        description: 'OAuth refresh token (if issued)',
        required: false,
    })
    @IsString()
    @IsOptional()
    refreshToken?: string;

    @ApiProperty({
        description: 'Access token expiry timestamp',
        required: false,
        type: String,
        format: 'date-time',
    })
    @IsOptional()
    expiresAt?: Date;
}
