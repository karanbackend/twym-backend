import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'contact_addresses' })
export class ContactAddress {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Contact, (c) => c.addresses, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

    @Column({ name: 'raw_address', type: 'text' })
    rawAddress: string;

    @Column({ name: 'street_number', type: 'text', nullable: true })
    streetNumber?: string | null;

    @Column({ name: 'street_name', type: 'text', nullable: true })
    streetName?: string | null;

    @Column({ name: 'unit_suite', type: 'text', nullable: true })
    unitSuite?: string | null;

    @Column({ name: 'city', type: 'text', nullable: true })
    city?: string | null;

    @Column({ name: 'state_province', type: 'text', nullable: true })
    stateProvince?: string | null;

    @Column({ name: 'postal_code', type: 'text', nullable: true })
    postalCode?: string | null;

    @Column({ name: 'country', type: 'text', nullable: true })
    country?: string | null;

    @Column({
        name: 'address_type',
        type: 'text',
        nullable: true,
        default: 'business',
    })
    addressType?: string | null;

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
