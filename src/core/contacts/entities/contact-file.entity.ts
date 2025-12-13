import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Contact } from './contact.entity';

@Entity({ name: 'contact_files' })
export class ContactFile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Contact, (c) => c.files, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'contact_id' })
    contact: Contact;

    @Column({ name: 'contact_id', type: 'uuid', nullable: true })
    contactId?: string | null;

    @Column({ name: 'file_id', type: 'uuid' })
    fileId: string;

    @Column({
        name: 'doc_type',
        type: 'text',
        nullable: false,
        default: 'business_card',
    })
    docType: string;

    @Column({ name: 'side', type: 'text', nullable: true })
    side?: string | null;

    @Column({
        name: 'is_active',
        type: 'boolean',
        nullable: false,
        default: true,
    })
    isActive: boolean;

    @Column({ name: 'ocr_text', type: 'text', nullable: true })
    ocrText?: string | null;

    @Column({
        name: 'ocr_confidence',
        type: 'numeric',
        precision: 5,
        scale: 2,
        nullable: true,
    })
    ocrConfidence?: number | null;

    @Column({ name: 'ocr_processed_at', type: 'timestamptz', nullable: true })
    ocrProcessedAt?: Date | null;

    @Column({
        name: 'processing_status',
        type: 'text',
        nullable: true,
        default: 'pending',
    })
    processingStatus?: string | null;

    @Column({ name: 'ocr_engine', type: 'text', nullable: true })
    ocrEngine?: string | null;

    @Column({ name: 'ocr_language', type: 'text', nullable: true })
    ocrLanguage?: string | null;

    @Column({
        name: 'processing_attempts',
        type: 'integer',
        nullable: false,
        default: 0,
    })
    processingAttempts: number;

    @Column({ name: 'last_attempt_at', type: 'timestamptz', nullable: true })
    lastAttemptAt?: Date | null;

    @Column({ name: 'processing_error', type: 'text', nullable: true })
    processingError?: string | null;

    @Column({ name: 'created_at', type: 'timestamptz', nullable: true })
    createdAt?: Date | null;
}
