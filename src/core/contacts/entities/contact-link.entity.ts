import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'contact_links' })
export class ContactLink {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Contact, (c) => c.links, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

    @Column({
        name: 'link_type',
        type: 'text',
        nullable: true,
        default: 'social',
    })
    linkType?: string | null;

    @Column({ name: 'platform', type: 'text' })
    platform: string;

    @Column({ name: 'url', type: 'text' })
    url: string;

    @Column({ name: 'display_name', type: 'text', nullable: true })
    displayName?: string | null;

    @Column({ name: 'sort_order', type: 'integer', nullable: true, default: 0 })
    sortOrder?: number | null;

    @Column({ name: 'created_at', type: 'timestamptz', nullable: true })
    createdAt?: Date | null;

    @Column({ name: 'updated_at', type: 'timestamptz', nullable: true })
    updatedAt?: Date | null;
}
