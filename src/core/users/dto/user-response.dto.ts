import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SubscriptionTier } from '../types';
import { SUBSCRIPTION_TIERS } from '../types';

export class UserResponseDto {
    @ApiProperty({ format: 'uuid', description: 'User id' })
    id!: string;

    @ApiPropertyOptional({
        description: 'Subscription tier',
        enum: SUBSCRIPTION_TIERS,
    })
    subscription_tier?: SubscriptionTier | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Subscription expires at',
    })
    subscription_expires_at?: Date | null;

    @ApiPropertyOptional({
        description: 'Whether the user is active',
        type: Boolean,
        example: true,
    })
    is_active?: boolean | null;

    @ApiPropertyOptional({
        description: 'Whether the user is deleted',
        type: Boolean,
        example: false,
    })
    is_deleted?: boolean | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Deletion requested at',
    })
    deletion_requested_at?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'Deletion scheduled for',
    })
    deletion_scheduled_for?: Date | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'When password was set',
    })
    password_set_at?: Date | null;

    @ApiPropertyOptional({
        description: 'Force password reset flag',
        type: Boolean,
        example: false,
    })
    force_password_reset?: boolean | null;

    @ApiPropertyOptional({
        description: 'Suspicious activity flag',
        type: Boolean,
        example: false,
    })
    suspicious_activity_flag?: boolean | null;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'When the user was created',
    })
    created_at?: Date;

    @ApiPropertyOptional({
        type: 'string',
        format: 'date-time',
        description: 'When the user was last updated',
    })
    updated_at?: Date;
}
