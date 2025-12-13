import { Entity, Column, PrimaryColumn, Index, CreateDateColumn } from 'typeorm';

@Index('idx_idempotency_keys_user', ['userId'])
@Index('idx_idempotency_keys_expires', ['expiresAt'])
@Entity({ name: 'idempotency_keys' })
export class IdempotencyKey {
    @PrimaryColumn({ name: 'key', type: 'text' })
    key: string;

    @Column({ name: 'user_id', type: 'uuid', nullable: true })
    userId?: string;

    @Column({ name: 'endpoint', type: 'text' })
    endpoint: string;

    @Column({ name: 'request_hash', type: 'text', nullable: true })
    requestHash?: string;

    @Column({ name: 'response_status', type: 'integer', nullable: true })
    responseStatus?: number;

    @Column({ name: 'response_body', type: 'jsonb', nullable: true })
    responseBody?: Record<string, unknown>;

    @CreateDateColumn({ name: 'first_seen_at', type: 'timestamptz' })
    firstSeenAt: Date;

    @Column({ name: 'expires_at', type: 'timestamptz' })
    expiresAt: Date;
}
