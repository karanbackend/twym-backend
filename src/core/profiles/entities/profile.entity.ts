import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    OneToOne,
    OneToMany,
    PrimaryColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ProfilePhoneNumber } from './profile-phone-number.entity';
import { ProfileEmail } from './profile-email.entity';
import { ProfileAddress } from './profile-address.entity';
import { ProfileLink } from './profile-link.entity';

@Entity({ name: 'user_profiles' })
@Index('idx_user_profiles_slug', ['deeplinkSlug'])
@Index('idx_user_profiles_handle', ['profileHandle'])
@Index('idx_user_profiles_user', ['userId'])
export class Profile {
    @PrimaryColumn('uuid', { name: 'id', default: () => 'gen_random_uuid()' })
    id!: string;

    @Column('uuid', { name: 'user_id', unique: true, nullable: false })
    userId!: string;

    @OneToOne(() => User, { nullable: false, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user!: User;

    @Column('text', { name: 'name', nullable: false })
    name!: string;

    @Column('text', { name: 'title', nullable: true })
    title?: string | null;

    @Column('text', { name: 'department', nullable: true })
    department?: string | null;

    @Column('text', { name: 'company_name', nullable: true })
    companyName?: string | null;

    @Column('text', { name: 'about_me', nullable: true })
    aboutMe?: string | null;

    @Column('text', {
        name: 'profile_tags',
        array: true,
        nullable: true,
        default: () => "'{}'::text[]",
    })
    profileTags?: string[] | null;

    @Column('text', { name: 'profile_handle', unique: true, nullable: true })
    profileHandle?: string | null;

    @Column('text', { name: 'deeplink_slug', unique: true, nullable: true })
    deeplinkSlug?: string | null;

    @Column('text', { name: 'profile_image_url', nullable: true })
    profileImageUrl?: string | null;

    @Column('text', { name: 'cover_image_url', nullable: true })
    coverImageUrl?: string | null;

    @Column('text', { name: 'profile_qr_code_url', nullable: true })
    profileQrCodeUrl?: string | null;

    @Column('text', { name: 'vcard_qr_code_url', nullable: true })
    vcardQrCodeUrl?: string | null;

    @Column('boolean', { name: 'vcard_enabled', nullable: true, default: true })
    vcardEnabled?: boolean | null;

    @Column('text', { name: 'vcard_version', nullable: true, default: '4.0' })
    vcardVersion?: string | null;

    @Column('timestamptz', { name: 'vcard_last_generated', nullable: true })
    vcardLastGenerated?: Date | null;

    @Column('jsonb', {
        name: 'vcard_privacy_settings',
        nullable: true,
        default: () =>
            "'{" +
            '"include_photo": true, "include_social": true, "include_address": true' +
            "}'::jsonb",
    })
    vcardPrivacySettings?: Record<string, any> | null;

    @Column('boolean', { name: 'is_public', nullable: true, default: true })
    isPublic?: boolean | null;

    @Column('boolean', {
        name: 'contact_capture_enabled',
        nullable: true,
        default: false,
    })
    contactCaptureEnabled?: boolean | null;

    @OneToMany(() => ProfilePhoneNumber, (pn) => pn.profile, { cascade: true })
    phoneNumbers?: ProfilePhoneNumber[] | null;

    @OneToMany(() => ProfileEmail, (e) => e.profile, { cascade: true })
    emails?: ProfileEmail[] | null;

    @OneToMany(() => ProfileAddress, (a) => a.profile, { cascade: true })
    addresses?: ProfileAddress[] | null;

    @OneToMany(() => ProfileLink, (l) => l.profile, { cascade: true })
    links?: ProfileLink[] | null;

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
