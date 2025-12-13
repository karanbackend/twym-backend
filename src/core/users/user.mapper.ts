import { User } from './entities/user.entity';
import { UserResponseDto } from './dto/user-response.dto';

export class UserMapper {
    static mapToDto(user: User): UserResponseDto | undefined {
        if (!user) return undefined;
        return {
            id: user.id,
            subscription_tier: user.subscriptionTier ?? undefined,
            subscription_expires_at: user.subscriptionExpiresAt ?? undefined,
            is_active: user.isActive,
            is_deleted: user.isDeleted,
            deletion_requested_at: user.deletionRequestedAt ?? undefined,
            deletion_scheduled_for: user.deletionScheduledFor ?? undefined,
            password_set_at: user.passwordSetAt ?? undefined,
            force_password_reset: user.forcePasswordReset,
            suspicious_activity_flag: user.suspiciousActivityFlag,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
        } as UserResponseDto;
    }
}
