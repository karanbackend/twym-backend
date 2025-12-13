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
import type { AddressType } from '../types';

@Entity({ name: 'profile_addresses' })
@Index('idx_profile_addresses_profile', ['profile'])
export class ProfileAddress {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('uuid', { name: 'profile_id' })
    profileId!: string;

    @ManyToOne(() => Profile, (p) => p.addresses, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column('text', { name: 'raw_address' })
    rawAddress!: string;

    @Column('text', { name: 'street_number', nullable: true })
    streetNumber?: string | null;

    @Column('text', { name: 'street_name', nullable: true })
    streetName?: string | null;

    @Column('text', { name: 'unit_suite', nullable: true })
    unitSuite?: string | null;

    @Column('text', { name: 'city', nullable: true })
    city?: string | null;

    @Column('text', { name: 'state_province', nullable: true })
    stateProvince?: string | null;

    @Column('text', { name: 'postal_code', nullable: true })
    postalCode?: string | null;

    @Column('text', { name: 'country', nullable: true })
    country?: string | null;

    @Column('text', { name: 'address_type', nullable: true })
    addressType?: AddressType;

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
