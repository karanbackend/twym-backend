import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Index,
    OneToMany,
} from 'typeorm';
import { Profile } from '../../profiles/entities/profile.entity';
import type { FormFieldDefinition } from '../types/contact-forms.types';
import { DEFAULT_FORM_FIELDS } from '../contact-forms.constants';

@Entity({ name: 'contact_capture_forms' })
@Index('idx_contact_capture_forms_profile', ['profileId'])
export class ContactForm {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'profile_id', type: 'uuid' })
    profileId: string;

    @ManyToOne(() => Profile, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'profile_id' })
    profile: Profile;

    @Column({
        name: 'form_fields',
        type: 'jsonb',
        default: DEFAULT_FORM_FIELDS,
    })
    formFields: FormFieldDefinition[];

    @Column({
        name: 'is_active',
        type: 'boolean',
        default: true,
        nullable: true,
    })
    isActive: boolean | null;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
    @OneToMany('ContactSubmission', (submission: any) => submission.form)
    submissions?: any[];
}
