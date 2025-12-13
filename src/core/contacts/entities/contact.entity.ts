import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { ContactAddress } from './contact-address.entity';
import { ContactEmail } from './contact-email.entity';
import { ContactFile } from './contact-file.entity';
import { ContactLink } from './contact-link.entity';
import { ContactPhoneNumber } from './contact-phone-number.entity';
import { User } from '../../users/entities/user.entity';

@Index('idx_contacts_owner', (c: Contact) => [c.ownerId, c.createdAt])
@Index('idx_contacts_active', (c: Contact) => [c.ownerId, c.createdAt], {
    where: '"deleted_at" IS NULL',
})
@Index('idx_contacts_pinned', (c: Contact) => [c.ownerId, c.isPinned], {
    where: 'is_pinned = true',
})
@Index('idx_contacts_favorite', (c: Contact) => [c.ownerId, c.isFavorite], {
    where: 'is_favorite = true',
})
@Index('idx_contacts_hash', (c: Contact) => [c.ownerId, c.contactHash], {
    where: 'contact_hash IS NOT NULL',
})
@Entity({ name: 'contacts' })
export class Contact {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'owner_id', type: 'uuid' })
    ownerId: string;

    @Column({ name: 'contact_type', type: 'text', default: 'external' })
    contactType: string;

    @Column({ name: 'linked_user_id', type: 'uuid', nullable: true })
    linkedUserId?: string | null;

    @Column({ name: 'name', type: 'text' })
    name: string;

    @Column({ name: 'title', type: 'text', nullable: true })
    title?: string | null;

    @Column({ name: 'department', type: 'text', nullable: true })
    department?: string | null;

    @Column({ name: 'company_name', type: 'text', nullable: true })
    companyName?: string | null;

    @Column({ name: 'about_me', type: 'text', nullable: true })
    aboutMe?: string | null;

    @Column({ name: 'profile_image_url', type: 'text', nullable: true })
    profileImageUrl?: string | null;

    @Column({ name: 'acquired_via', type: 'text' })
    acquiredVia: string;

    @Column({ name: 'scanned_type', type: 'text', nullable: true })
    scannedType?: string | null;

    @Column({ name: 'acquired_at', type: 'timestamptz', nullable: true })
    acquiredAt?: Date | null;

    @Column({ name: 'event_id', type: 'uuid', nullable: true })
    eventId?: string | null;

    @Column({ name: 'lounge_session_id', type: 'uuid', nullable: true })
    loungeSessionId?: string | null;

    @Column({ name: 'contact_submission_id', type: 'uuid', nullable: true })
    contactSubmissionId?: string | null;

    @Column({ name: 'meeting_notes', type: 'text', nullable: true })
    meetingNotes?: string | null;

    @Column({
        name: 'is_favorite',
        type: 'boolean',
        nullable: true,
        default: false,
    })
    isFavorite?: boolean | null;

    @Column({
        name: 'is_pinned',
        type: 'boolean',
        nullable: true,
        default: false,
    })
    isPinned?: boolean | null;

    @Column('text', {
        name: 'automatic_tags',
        array: true,
        nullable: true,
        default: () => 'array[]::text[]',
    })
    automaticTags?: string[] | null;

    @Column('text', {
        name: 'user_tags',
        array: true,
        nullable: true,
        default: () => 'array[]::text[]',
    })
    userTags?: string[] | null;

    @Column({ name: 'contact_hash', type: 'text', nullable: true })
    contactHash?: string | null;

    @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
    deletedAt?: Date | null;

    @Column({ name: 'created_at', type: 'timestamptz', nullable: true })
    createdAt?: Date | null;

    @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
    updatedAt?: Date | null;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'owner_id' })
    owner!: User;

    @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'linked_user_id' })
    linkedUser?: User | null;

    // Relations (one-to-many)
    @OneToMany(() => ContactPhoneNumber, (p) => p.contact, {
        cascade: true,
        eager: false,
    })
    phoneNumbers?: ContactPhoneNumber[];

    @OneToMany(() => ContactEmail, (e) => e.contact, {
        cascade: true,
        eager: false,
    })
    emails?: ContactEmail[];

    @OneToMany(() => ContactAddress, (a) => a.contact, {
        cascade: true,
        eager: false,
    })
    addresses?: ContactAddress[];

    @OneToMany(() => ContactLink, (l) => l.contact, {
        cascade: true,
        eager: false,
    })
    links?: ContactLink[];

    @OneToMany(() => ContactFile, (f) => f.contact, {
        cascade: true,
        eager: false,
    })
    files?: ContactFile[];
}
