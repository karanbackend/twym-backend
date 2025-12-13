import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import { Contact } from '../../contacts/entities/contact.entity';

@Entity({ name: 'contact_submissions' })
@Index('idx_contact_submissions_form', ['formId', 'createdAt'])
@Index('idx_contact_submissions_profile', ['profileId', 'createdAt'])
@Index('idx_contact_submissions_contact', ['createdContactId'])
@Index('idx_contact_submissions_unread', ['profileId', 'isRead'], {
    where: 'is_read = false',
})
@Index('idx_contact_submissions_expires', ['expiresAt'], {
    where: 'expires_at IS NOT NULL',
})
export class ContactSubmission {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'form_id', type: 'uuid' })
    formId: string;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    @ManyToOne('ContactForm', (form: any) => form.submissions, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'form_id' })
    form?: any;

    @Column({ name: 'profile_id', type: 'uuid' })
    profileId: string;

    @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id' })
    profile: Profile;

    @Column({ name: 'submission_data', type: 'jsonb' })
    submissionData: Record<string, any>;

    @Column({ name: 'created_contact_id', type: 'uuid', nullable: true })
    createdContactId: string | null;

    @ManyToOne(() => Contact, { onDelete: 'SET NULL', nullable: true })
    @JoinColumn({ name: 'created_contact_id' })
    createdContact: Contact | null;

    @Column({ name: 'visitor_ip', type: 'inet', nullable: true })
    visitorIp: string | null;

    @Column({ name: 'user_agent', type: 'text', nullable: true })
    userAgent: string | null;

    @Column({ name: 'referrer', type: 'text', nullable: true })
    referrer: string | null;

    @Column({
        name: 'captcha_verified',
        type: 'boolean',
        default: false,
        nullable: true,
    })
    captchaVerified: boolean | null;

    @Column({
        name: 'is_read',
        type: 'boolean',
        default: false,
        nullable: true,
    })
    isRead: boolean | null;

    @Column({
        name: 'expires_at',
        type: 'timestamptz',
        nullable: true,
    })
    expiresAt: Date | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
