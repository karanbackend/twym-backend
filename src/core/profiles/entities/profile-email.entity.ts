import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import type { EmailType } from '../types';

@Entity({ name: 'profile_emails' })
@Index('idx_profile_emails_profile', ['profile'])
export class ProfileEmail {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('uuid', { name: 'profile_id' })
    profileId!: string;

    @ManyToOne(() => Profile, (p) => p.emails, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column('text', { name: 'email' })
    email!: string;

    @Column('text', { name: 'email_type' })
    emailType!: EmailType;

    @Column('boolean', { name: 'is_primary', default: false })
    isPrimary?: boolean | null;

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
