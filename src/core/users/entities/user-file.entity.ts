import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FilePurpose {
    PROFILE_IMAGE = 'profile_image',
    COVER_IMAGE = 'cover_image',
}

@Entity({ name: 'user_files' })
@Index('idx_user_files_owner', ['ownerId'])
@Index('idx_user_files_purpose', ['purpose'])
@Index('idx_user_files_sha256', ['sha256'])
export class UserFile {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('uuid', { name: 'owner_id', nullable: false })
    ownerId!: string;

    @ManyToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner!: User;

    @Column('text', { name: 'file_url', nullable: false })
    fileUrl!: string;

    @Column('text', { name: 'filename', nullable: true })
    filename?: string | null;

    @Column('text', { name: 'mime_type', nullable: true })
    mimeType?: string | null;

    @Column('bigint', { name: 'size_bytes', nullable: true })
    sizeBytes?: number | null;

    @Column('text', { name: 'purpose', nullable: true })
    purpose?: string | null;

    @Column('text', { name: 'sha256', nullable: true })
    sha256?: string | null;

    @Column('text', { name: 'storage_bucket', nullable: true })
    storageBucket?: string | null;

    @Column('text', { name: 'storage_object_path', nullable: true })
    storageObjectPath?: string | null;

    @Column('jsonb', { name: 'metadata', nullable: true, default: '{}' })
    metadata?: Record<string, any> | null;

    @CreateDateColumn({
        type: 'timestamptz',
        name: 'created_at',
        default: () => 'now()',
    })
    createdAt?: Date;
}
