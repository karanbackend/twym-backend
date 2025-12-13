import type { FormFieldDefinition } from '../types/contact-forms.types';

export class ContactFormResponseDto {
    id: string;
    profileId: string;
    formFields: FormFieldDefinition[];
    isActive: boolean | null;
    createdAt: Date;
    updatedAt: Date;
}
