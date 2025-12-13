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
import type { LinkType } from '../types';
import { LINK_TYPE } from '../types';

@Entity({ name: 'profile_links' })
@Index('idx_profile_links_profile', ['profile'])
export class ProfileLink {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('uuid', { name: 'profile_id' })
    profileId!: string;

    @ManyToOne(() => Profile, (p) => p.links, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column('text', { name: 'link_type', default: LINK_TYPE.SOCIAL })
    linkType?: LinkType;

    @Column('text', { name: 'platform' })
    platform!: string;

    @Column('text', { name: 'url' })
    url!: string;

    @Column('text', { name: 'display_name', nullable: true })
    displayName?: string | null;

    @Column('int', { name: 'sort_order', default: 0 })
    sortOrder?: number | null;

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
