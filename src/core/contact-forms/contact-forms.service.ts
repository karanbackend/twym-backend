import {
    NotFoundException,
    BadRequestException,
    ConflictException,
    Logger,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContactFormRepository } from './contact-form.repository';
import { ContactSubmissionRepository } from './contact-submission.repository';
import { ProfilesService } from '../profiles/profiles.service';
import { ContactsService } from '../contacts/contacts.service';
import { CreateContactFormDto } from './dto/create-contact-form.dto';
import { UpdateContactFormDto } from './dto/update-contact-form.dto';
import { SubmitContactFormDto } from './dto/submit-contact-form.dto';
import { MarkSubmissionReadDto } from './dto/mark-submission-read.dto';
import { ContactFormResponseDto } from './dto/contact-form-response.dto';
import { ContactSubmissionResponseDto } from './dto/contact-submission-response.dto';
import { CreateContactDto } from '../contacts/dto/create-contact.dto';
import { ACQUIRED_VIA } from '../contacts/enums';
import { ContactForm } from './entities/contact-form.entity';
import { ContactSubmission } from './entities/contact-submission.entity';
import {
    CONTACT_FORMS_CONFIG,
    CONTACT_FORMS_ERRORS,
    CONTACT_FORMS_LOGS,
    SUBMISSION_CONTACT_DEFAULTS,
} from './contact-forms.constants';
import type { FormFieldDefinition } from './types/contact-forms.types';

export class ContactFormsService {
    private readonly logger = new Logger(ContactFormsService.name);

    constructor(
        private readonly contactFormRepo: ContactFormRepository,
        private readonly submissionRepo: ContactSubmissionRepository,
        private readonly profilesService: ProfilesService,
        @Inject(forwardRef(() => ContactsService))
        private readonly contactsService: ContactsService,
    ) {}

    // US-F1: Enable Contact Form (Create)
    async createForm(
        userId: string,
        createContactFormDto: CreateContactFormDto,
    ): Promise<ContactFormResponseDto> {
        // Get user's profile via ProfilesService (respecting bounded context)
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        // Ensure there isn't already a form for this profile
        const existingForm = await this.contactFormRepo.findOneByProfileId(profile.id);
        if (existingForm) {
            throw new ConflictException('Contact form already exists for this profile');
        }

        const providedFields: FormFieldDefinition[] = [
            {
                name: 'name',
                type: 'text',
                label: createContactFormDto.name,
                required: true,
            },
            {
                name: 'email',
                type: 'email',
                label: createContactFormDto.email,
                required: true,
            },
            {
                name: 'phone',
                type: 'tel',
                label: createContactFormDto.phone,
                required: false,
            },
            {
                name: 'job_title',
                type: 'text',
                label: createContactFormDto.jobTitle,
                required: false,
            },
            {
                name: 'company',
                type: 'text',
                label: createContactFormDto.company,
                required: false,
            },
            {
                name: 'message',
                type: 'textarea',
                label: createContactFormDto.message,
                required: false,
            },
        ];

        const form = this.contactFormRepo.create({
            profileId: profile.id,
            formFields: providedFields,
            isActive:
                createContactFormDto.isActive !== undefined ? createContactFormDto.isActive : true,
        });

        const saved = await this.contactFormRepo.save(form);
        this.logger.log(CONTACT_FORMS_LOGS.FORM_CREATED(profile.id, userId));

        return this.mapFormToDto(saved);
    }

    async getFormByUserId(userId: string): Promise<ContactFormResponseDto> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const form = await this.contactFormRepo.findOneByProfileId(profile.id);
        if (!form) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND);
        }

        return this.mapFormToDto(form);
    }

    async getFormByProfileId(profileId: string): Promise<ContactFormResponseDto> {
        const form = await this.contactFormRepo.findOneByProfileId(profileId);
        if (!form) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND);
        }

        // Ensure the owning profile has contact capture enabled
        const profile = await this.profilesService.findOne(profileId);
        if (!profile.contact_capture_enabled) {
            throw new BadRequestException(CONTACT_FORMS_ERRORS.FORM_INACTIVE);
        }

        return this.mapFormToDto(form);
    }

    // US-F1: Enable Contact Form (Update)
    async updateForm(
        userId: string,
        updateContactFormDto: UpdateContactFormDto,
    ): Promise<ContactFormResponseDto> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const form = await this.contactFormRepo.findOneByProfileId(profile.id);
        if (!form) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND);
        }

        // Only allow toggling isActive via update DTO
        if (updateContactFormDto.isActive !== undefined) {
            form.isActive = updateContactFormDto.isActive;
        }

        const updated = await this.contactFormRepo.save(form);
        this.logger.log(CONTACT_FORMS_LOGS.FORM_UPDATED(form.id, userId));

        return this.mapFormToDto(updated);
    }

    async deleteForm(userId: string): Promise<void> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const form = await this.contactFormRepo.findOneByProfileId(profile.id);
        if (!form) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND);
        }

        await this.contactFormRepo.remove(form);
        this.logger.log(CONTACT_FORMS_LOGS.FORM_DELETED(form.id, userId));
    }

    // US-F2: Submit Contact Form (Visitor)
    async submitForm(
        profileId: string,
        submitDto: SubmitContactFormDto,
    ): Promise<ContactSubmissionResponseDto> {
        // Find form
        const form = await this.contactFormRepo.findOneByProfileId(profileId);
        if (!form) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND);
        }

        // Ensure the owning profile has contact capture enabled
        const profile = await this.profilesService.findOne(profileId);
        if (!profile.contact_capture_enabled) {
            throw new BadRequestException(CONTACT_FORMS_ERRORS.FORM_INACTIVE);
        }

        if (!form.isActive) {
            throw new BadRequestException(CONTACT_FORMS_ERRORS.FORM_INACTIVE);
        }

        // Rate limiting: Use constant configuration
        if (submitDto.visitorIp) {
            const submissionsToday = await this.submissionRepo.countSubmissionsByIpToday(
                submitDto.visitorIp,
            );

            if (submissionsToday >= CONTACT_FORMS_CONFIG.RATE_LIMIT.MAX_SUBMISSIONS_PER_DAY) {
                throw new BadRequestException(CONTACT_FORMS_ERRORS.RATE_LIMIT_EXCEEDED);
            }
        }

        // Validate submission data against form fields using sanitized map
        const rawData =
            submitDto.submissionData && typeof submitDto.submissionData === 'object'
                ? (submitDto.submissionData as Record<string, unknown>)
                : {};
        const sanitized = this.sanitizeSubmissionData(rawData);
        this.validateSubmissionData(form.formFields, sanitized);

        // Build sanitized submissionData object for persistence
        const submissionDataObj: Record<string, string> = {};
        if (sanitized.name) submissionDataObj.name = sanitized.name;
        if (sanitized.email) submissionDataObj.email = sanitized.email;
        if (sanitized.phone) submissionDataObj.phone = sanitized.phone;
        if (sanitized.job_title) submissionDataObj.job_title = sanitized.job_title;
        if (sanitized.company) submissionDataObj.company = sanitized.company;
        if (sanitized.message) submissionDataObj.message = sanitized.message;

        // Create submission with configured expiry
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + CONTACT_FORMS_CONFIG.EXPIRY.DAYS);

        const submission = this.submissionRepo.create({
            formId: form.id,
            profileId: form.profileId,
            submissionData: submissionDataObj,
            visitorIp: submitDto.visitorIp || null,
            userAgent: submitDto.userAgent || null,
            referrer: submitDto.referrer || null,
            captchaVerified: submitDto.captchaVerified || false,
            isRead: false,
            expiresAt,
        });

        const saved = await this.submissionRepo.save(submission);
        this.logger.log(CONTACT_FORMS_LOGS.SUBMISSION_RECEIVED(saved.id, profileId));

        return this.mapSubmissionToDto(saved);
    }

    // US-F3: View Form Submissions Inbox
    async getSubmissions(
        userId: string,
        unreadOnly = false,
    ): Promise<ContactSubmissionResponseDto[]> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const submissions = unreadOnly
            ? await this.submissionRepo.findUnreadByProfileId(profile.id)
            : await this.submissionRepo.findByProfileId(profile.id);

        return submissions.map((s) => this.mapSubmissionToDto(s));
    }

    async getSubmissionById(
        userId: string,
        submissionId: string,
    ): Promise<ContactSubmissionResponseDto> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const submission = await this.submissionRepo.findOneById(submissionId);
        if (!submission || submission.profileId !== profile.id) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.SUBMISSION_NOT_FOUND);
        }

        return this.mapSubmissionToDto(submission);
    }

    async getUnreadCount(userId: string): Promise<number> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        return this.submissionRepo.countUnreadByProfileId(profile.id);
    }

    // US-F5: Dismiss Form Submission
    async markSubmissionAsRead(
        userId: string,
        submissionId: string,
        markReadDto: MarkSubmissionReadDto,
    ): Promise<ContactSubmissionResponseDto> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const submission = await this.submissionRepo.findOneById(submissionId);
        if (!submission || submission.profileId !== profile.id) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.SUBMISSION_NOT_FOUND);
        }

        submission.isRead = markReadDto.isRead !== undefined ? markReadDto.isRead : true;

        const updated = await this.submissionRepo.save(submission);
        this.logger.log(
            CONTACT_FORMS_LOGS.SUBMISSION_MARKED_READ(
                submissionId,
                updated.isRead ?? false,
                userId,
            ),
        );

        return this.mapSubmissionToDto(updated);
    }

    // US-F4: Manually Add Submission to Contacts
    async addSubmissionToContacts(userId: string, submissionId: string): Promise<any> {
        const profile = await this.profilesService.findByUserId(userId);
        if (!profile) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND);
        }

        const submission = await this.submissionRepo.findOneById(submissionId);
        if (!submission || submission.profileId !== profile.id) {
            throw new NotFoundException(CONTACT_FORMS_ERRORS.SUBMISSION_NOT_FOUND);
        }

        if (submission.createdContactId) {
            throw new ConflictException(CONTACT_FORMS_ERRORS.ALREADY_CONVERTED);
        }

        // Map submission data to contact DTO using typed submission data
        const sanitized = this.sanitizeSubmissionData(
            submission.submissionData as Record<string, unknown>,
        );

        const name = sanitized.name && sanitized.name.trim() !== '' ? sanitized.name : 'Unknown';
        const email = sanitized.email || undefined;
        const phone = sanitized.phone || undefined;
        const jobTitle = sanitized.job_title || null;
        const company = sanitized.company || null;
        const message = sanitized.message || null;

        const contactDto: CreateContactDto = {
            name: String(name),
            title: jobTitle ?? null,
            company_name: company ?? null,
            acquired_via: ACQUIRED_VIA.CONTACT_CAPTURE_FORM,
            meeting_notes: message ?? null,
            automatic_tags: [SUBMISSION_CONTACT_DEFAULTS.AUTO_TAG],
            emails: email
                ? [
                      {
                          email: email,
                          email_type: SUBMISSION_CONTACT_DEFAULTS.EMAIL_TYPE,
                          is_primary: SUBMISSION_CONTACT_DEFAULTS.IS_PRIMARY,
                      },
                  ]
                : [],
            phone_numbers: phone
                ? [
                      {
                          raw_number: phone,
                          number_type: SUBMISSION_CONTACT_DEFAULTS.NUMBER_TYPE,
                          is_primary: SUBMISSION_CONTACT_DEFAULTS.IS_PRIMARY,
                      },
                  ]
                : [],
        };

        // Create contact using ContactsService
        const contactResult = await this.contactsService.create(contactDto, userId);

        // Check if it's a duplicate
        if ('duplicate' in contactResult && contactResult.duplicate) {
            throw new ConflictException(CONTACT_FORMS_ERRORS.CONTACT_EXISTS);
        }

        // Update submission with created contact ID
        if ('id' in contactResult) {
            submission.createdContactId = contactResult.id;
        }
        submission.isRead = true;
        await this.submissionRepo.save(submission);

        const contactId = 'id' in contactResult ? contactResult.id : 'unknown';
        this.logger.log(CONTACT_FORMS_LOGS.SUBMISSION_CONVERTED(submissionId, contactId));

        return contactResult;
    }

    // Cleanup expired submissions (runs daily)
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupExpiredSubmissions(): Promise<void> {
        this.logger.log(CONTACT_FORMS_LOGS.CLEANUP_STARTED);

        try {
            const expired = await this.submissionRepo.findExpiredSubmissions();

            if (expired.length === 0) {
                this.logger.log(CONTACT_FORMS_LOGS.CLEANUP_NONE);
                return;
            }

            await this.submissionRepo.removeMany(expired);
            this.logger.log(CONTACT_FORMS_LOGS.CLEANUP_COMPLETE(expired.length));
        } catch (error) {
            this.logger.error(
                CONTACT_FORMS_LOGS.CLEANUP_FAILED,
                error instanceof Error ? error.stack : String(error),
            );
        }
    }

    // Helper methods
    private sanitizeSubmissionData(raw: Record<string, unknown>): {
        name?: string;
        email?: string;
        phone?: string;
        job_title?: string;
        company?: string;
        message?: string;
    } {
        const out: {
            name?: string;
            email?: string;
            phone?: string;
            job_title?: string;
            company?: string;
            message?: string;
        } = {};
        const keys = ['name', 'email', 'phone', 'job_title', 'company', 'message'] as const;
        for (const k of keys) {
            const v = raw[k];
            if (typeof v === 'string') {
                out[k] = v.trim();
            }
        }
        return out;
    }

    private validateSubmissionData(
        formFields: ReadonlyArray<FormFieldDefinition>,
        submissionData: {
            name?: string;
            email?: string;
            phone?: string;
            job_title?: string;
            company?: string;
            message?: string;
        },
    ): void {
        for (const field of formFields) {
            const label = String(field.label ?? 'Field');
            const value = submissionData[field.name as keyof typeof submissionData];

            if (field.required && (!value || value === '')) {
                throw new BadRequestException(CONTACT_FORMS_ERRORS.REQUIRED_FIELD_MISSING(label));
            }

            if (value && field.type === 'email' && !this.isValidEmail(value)) {
                throw new BadRequestException(CONTACT_FORMS_ERRORS.INVALID_EMAIL_FORMAT(label));
            }
        }
    }

    private isValidEmail(email: string): boolean {
        return CONTACT_FORMS_CONFIG.VALIDATION.EMAIL_REGEX.test(email);
    }

    private mapFormToDto(form: ContactForm): ContactFormResponseDto {
        return {
            id: form.id,
            profileId: form.profileId,
            formFields: form.formFields,
            isActive: form.isActive,
            createdAt: form.createdAt,
            updatedAt: form.updatedAt,
        };
    }

    private mapSubmissionToDto(submission: ContactSubmission): ContactSubmissionResponseDto {
        return {
            id: submission.id,
            formId: submission.formId,
            profileId: submission.profileId,
            submissionData: submission.submissionData,
            createdContactId: submission.createdContactId,
            visitorIp: submission.visitorIp,
            userAgent: submission.userAgent,
            referrer: submission.referrer,
            captchaVerified: submission.captchaVerified,
            isRead: submission.isRead,
            expiresAt: submission.expiresAt,
            createdAt: submission.createdAt,
        };
    }
}
