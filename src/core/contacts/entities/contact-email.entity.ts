import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'contact_emails' })
export class ContactEmail {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Contact, (c) => c.emails, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

    @Column({ name: 'email', type: 'text' })
    email: string;

    @Column({
        name: 'email_type',
        type: 'text',
        nullable: true,
        default: 'work',
    })
    emailType?: string | null;

    @Column({
        name: 'is_primary',
        type: 'boolean',
        nullable: true,
        default: false,
    })
    isPrimary?: boolean | null;

    @Column({ name: 'created_at', type: 'timestamptz', nullable: true })
    createdAt?: Date | null;

    @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
    updatedAt?: Date | null;
}
