import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    Index,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

@Index('idx_calendar_connections_user', ['userId'])
@Index('idx_calendar_connections_expired', ['tokenExpiresAt', 'isActive'], {
    where: '(token_expires_at IS NOT NULL AND is_active = true)',
})
@Index('idx_calendar_connections_user_provider', ['userId', 'provider'])
@Index('uniq_calendar_user_provider', ['userId', 'provider'], { unique: true })
@Entity({ name: 'calendar_connections' })
export class CalendarConnection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'user_id', type: 'uuid' })
    userId: string;

    @Column({ name: 'provider', type: 'text' })
    provider: 'google' | 'microsoft';

    @Column({ name: 'access_token_encrypted', type: 'text' })
    accessTokenEncrypted: string;

    @Column({ name: 'refresh_token_encrypted', type: 'text', nullable: true })
    refreshTokenEncrypted?: string;

    @Column({ name: 'token_expires_at', type: 'timestamptz', nullable: true })
    tokenExpiresAt?: Date;

    @Column({ name: 'calendar_id', type: 'text', nullable: true })
    calendarId?: string;

    @Column({ name: 'calendar_name', type: 'text', nullable: true })
    calendarName?: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    isActive: boolean;

    @Column({ name: 'last_synced_at', type: 'timestamptz', nullable: true })
    lastSyncedAt?: Date;

    @Column({ name: 'last_sync_error', type: 'text', nullable: true })
    lastSyncError?: string;

    @Column({ name: 'sync_failure_count', type: 'integer', default: 0 })
    syncFailureCount: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
