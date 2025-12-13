import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Check,
    OneToOne,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';

export enum SubscriptionTier {
    FREE = 'free',
    PRO = 'pro',
    PRO_PLUS = 'pro_plus',
    ENTERPRISE = 'enterprise',
}

@Entity({ name: 'users' })
@Check(
    'users_subscription_tier_check',
    "subscription_tier = any (array['free'::text, 'pro'::text, 'pro_plus'::text, 'enterprise'::text])",
)
export class User {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('text', {
        name: 'subscription_tier',
        nullable: true,
        default: () => "'free'::text",
    })
    subscriptionTier?: SubscriptionTier | null;

    @Column('timestamptz', { name: 'subscription_expires_at', nullable: true })
    subscriptionExpiresAt?: Date | null;

    @Column('boolean', { name: 'is_active', default: true })
    isActive!: boolean;

    @Column('boolean', { name: 'is_deleted', default: false })
    isDeleted!: boolean;

    @Column('timestamptz', { name: 'deletion_requested_at', nullable: true })
    deletionRequestedAt?: Date | null;

    @Column('timestamptz', { name: 'deletion_scheduled_for', nullable: true })
    deletionScheduledFor?: Date | null;

    @Column('timestamptz', { name: 'password_set_at', nullable: true })
    passwordSetAt?: Date | null;

    @Column('boolean', { name: 'force_password_reset', default: false })
    forcePasswordReset!: boolean;

    @Column('boolean', { name: 'suspicious_activity_flag', default: false })
    suspiciousActivityFlag!: boolean;

    @OneToOne(() => Profile, (p) => p.user)
    profile?: Profile | null;

    @CreateDateColumn({
        type: 'timestamptz',
        name: 'created_at',
        default: () => 'now()',
    })
    createdAt?: Date;

    @UpdateDateColumn({
        type: 'timestamptz',
        name: 'updated_at',
        default: () => 'now()',
    })
    updatedAt?: Date;
}
