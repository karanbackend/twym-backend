import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'contact_phone_numbers' })
export class ContactPhoneNumber {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Contact, (c) => c.phoneNumbers, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

    @Column({ name: 'number_type', type: 'text' })
    numberType: string;

    @Column({ name: 'raw_number', type: 'text' })
    rawNumber: string;

    @Column({ name: 'country_code', type: 'text', nullable: true })
    countryCode?: string | null;

    @Column({ name: 'area_code', type: 'text', nullable: true })
    areaCode?: string | null;

    @Column({ name: 'local_number', type: 'text', nullable: true })
    localNumber?: string | null;

    @Column({ name: 'extension', type: 'text', nullable: true })
    extension?: string | null;

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
