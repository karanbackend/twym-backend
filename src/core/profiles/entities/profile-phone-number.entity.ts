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
import type { PhoneNumberType } from '../types';

@Entity({ name: 'profile_phone_numbers' })
@Index('idx_profile_phone_numbers_profile', ['profile'])
export class ProfilePhoneNumber {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('uuid', { name: 'profile_id' })
    profileId!: string;

    @ManyToOne(() => Profile, (p) => p.phoneNumbers, {
        nullable: false,
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'profile_id' })
    profile!: Profile;

    @Column('text', { name: 'number_type' })
    numberType!: PhoneNumberType;

    @Column('text', { name: 'raw_number' })
    rawNumber!: string;

    @Column('text', { name: 'country_code', nullable: true })
    countryCode?: string | null;

    @Column('text', { name: 'area_code', nullable: true })
    areaCode?: string | null;

    @Column('text', { name: 'local_number', nullable: true })
    localNumber?: string | null;

    @Column('text', { name: 'extension', nullable: true })
    extension?: string | null;

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
