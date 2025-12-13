import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, IsDateString } from 'class-validator';
import type { SubscriptionTier } from '../types';
import { SUBSCRIPTION_TIERS } from '../types';

export class CreateUserDto {
    @ApiPropertyOptional({
        description: 'Subscription tier for the user',
        enum: SUBSCRIPTION_TIERS,
        default: 'free',
    })
    @IsOptional()
    @IsString({ message: 'subscription_tier must be a string' })
    @IsIn(SUBSCRIPTION_TIERS, {
        message: `subscription_tier must be one of: ${SUBSCRIPTION_TIERS.join(', ')}`,
    })
    subscription_tier?: SubscriptionTier | null;

    @ApiPropertyOptional({
        description: 'Timestamp when the subscription expires',
        type: 'string',
        format: 'date-time',
    })
    @IsOptional()
    @IsDateString({}, { message: 'subscription_expires_at must be a valid date-time string' })
    subscription_expires_at?: string | null;

    @ApiPropertyOptional({
        description: 'Whether the user is active',
        default: true,
    })
    @IsOptional()
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean | null;

    @ApiPropertyOptional({
        description: 'Force the user to reset their password at next login',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'force_password_reset must be a boolean' })
    force_password_reset?: boolean | null;

    @ApiPropertyOptional({
        description: 'Flag for suspicious activity on the user account',
        default: false,
    })
    @IsOptional()
    @IsBoolean({ message: 'suspicious_activity_flag must be a boolean' })
    suspicious_activity_flag?: boolean | null;
}
