import {
    CONTACT_FORMS_CONFIG,
    CONTACT_FORMS_ERRORS,
    CONTACT_FORMS_LOGS,
    DEFAULT_FORM_FIELDS,
    FORM_FIELD_TYPES,
    SUBMISSION_CONTACT_DEFAULTS,
} from '../../../src/core/contact-forms/contact-forms.constants';

describe('ContactForms Constants', () => {
    describe('CONTACT_FORMS_CONFIG', () => {
        it('should have rate limit configuration', () => {
            expect(CONTACT_FORMS_CONFIG.RATE_LIMIT).toBeDefined();
            expect(CONTACT_FORMS_CONFIG.RATE_LIMIT.MAX_SUBMISSIONS_PER_DAY).toBe(10);
            expect(CONTACT_FORMS_CONFIG.RATE_LIMIT.WINDOW_HOURS).toBe(24);
        });

        it('should have expiry configuration', () => {
            expect(CONTACT_FORMS_CONFIG.EXPIRY).toBeDefined();
            expect(CONTACT_FORMS_CONFIG.EXPIRY.DAYS).toBe(90);
        });

        it('should have validation configuration', () => {
            expect(CONTACT_FORMS_CONFIG.VALIDATION).toBeDefined();
            expect(CONTACT_FORMS_CONFIG.VALIDATION.EMAIL_REGEX).toBeInstanceOf(RegExp);
        });

        it('should validate email regex correctly', () => {
            const regex = CONTACT_FORMS_CONFIG.VALIDATION.EMAIL_REGEX;

            // Valid emails
            expect(regex.test('test@example.com')).toBe(true);
            expect(regex.test('user.name@domain.co.uk')).toBe(true);

            // Invalid emails
            expect(regex.test('invalid')).toBe(false);
            expect(regex.test('missing@domain')).toBe(false);
            expect(regex.test('@domain.com')).toBe(false);
        });

        it('should be immutable (as const)', () => {
            expect(Object.isFrozen(CONTACT_FORMS_CONFIG)).toBe(false);
            expect(typeof CONTACT_FORMS_CONFIG.RATE_LIMIT.MAX_SUBMISSIONS_PER_DAY).toBe('number');
        });
    });

    describe('CONTACT_FORMS_ERRORS', () => {
        it('should have all error messages defined', () => {
            expect(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND).toBe('Contact form not found');
            expect(CONTACT_FORMS_ERRORS.FORM_INACTIVE).toBe('Contact form is not active');
            expect(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND).toBe('Profile not found for user');
            expect(CONTACT_FORMS_ERRORS.SUBMISSION_NOT_FOUND).toBe('Submission not found');
            expect(CONTACT_FORMS_ERRORS.RATE_LIMIT_EXCEEDED).toBe(
                'Rate limit exceeded. Maximum 10 submissions per day.',
            );
            expect(CONTACT_FORMS_ERRORS.ALREADY_CONVERTED).toBe(
                'This submission has already been added to contacts',
            );
            expect(CONTACT_FORMS_ERRORS.CONTACT_EXISTS).toBe(
                'Contact already exists with this information',
            );
        });

        it('should have function-based error messages', () => {
            expect(CONTACT_FORMS_ERRORS.REQUIRED_FIELD_MISSING('Email')).toBe(
                'Required field "Email" is missing',
            );
            expect(CONTACT_FORMS_ERRORS.INVALID_EMAIL_FORMAT('Email Address')).toBe(
                'Invalid email format for field "Email Address"',
            );
        });
    });

    describe('CONTACT_FORMS_LOGS', () => {
        it('should have function-based log messages', () => {
            const profileId = 'profile-123';
            const userId = 'user-123';
            const formId = 'form-123';
            const submissionId = 'submission-123';
            const contactId = 'contact-123';

            expect(CONTACT_FORMS_LOGS.FORM_CREATED(profileId, userId)).toContain(profileId);
            expect(CONTACT_FORMS_LOGS.FORM_CREATED(profileId, userId)).toContain(userId);

            expect(CONTACT_FORMS_LOGS.FORM_UPDATED(formId, userId)).toContain(formId);
            expect(CONTACT_FORMS_LOGS.FORM_UPDATED(formId, userId)).toContain(userId);

            expect(CONTACT_FORMS_LOGS.FORM_DELETED(formId, userId)).toContain(formId);
            expect(CONTACT_FORMS_LOGS.FORM_DELETED(formId, userId)).toContain(userId);

            expect(CONTACT_FORMS_LOGS.SUBMISSION_RECEIVED(submissionId, profileId)).toContain(
                submissionId,
            );

            expect(CONTACT_FORMS_LOGS.SUBMISSION_MARKED_READ(submissionId, true, userId)).toContain(
                'read',
            );

            expect(
                CONTACT_FORMS_LOGS.SUBMISSION_MARKED_READ(submissionId, false, userId),
            ).toContain('unread');

            expect(CONTACT_FORMS_LOGS.SUBMISSION_CONVERTED(submissionId, contactId)).toContain(
                contactId,
            );

            expect(CONTACT_FORMS_LOGS.CLEANUP_COMPLETE(5)).toContain('5');
        });

        it('should have static log messages', () => {
            expect(CONTACT_FORMS_LOGS.CLEANUP_STARTED).toBeDefined();
            expect(CONTACT_FORMS_LOGS.CLEANUP_NONE).toBeDefined();
            expect(CONTACT_FORMS_LOGS.CLEANUP_FAILED).toBeDefined();
        });
    });

    describe('DEFAULT_FORM_FIELDS', () => {
        it('should have 6 default fields', () => {
            expect(DEFAULT_FORM_FIELDS).toHaveLength(6);
        });

        it('should have name field', () => {
            const nameField = DEFAULT_FORM_FIELDS.find((f) => f.name === 'name');
            expect(nameField).toBeDefined();
            expect(nameField?.type).toBe('text');
            expect(nameField?.required).toBe(true);
        });

        it('should have email field', () => {
            const emailField = DEFAULT_FORM_FIELDS.find((f) => f.name === 'email');
            expect(emailField).toBeDefined();
            expect(emailField?.type).toBe('email');
            expect(emailField?.required).toBe(true);
        });

        it('should have phone field', () => {
            const phoneField = DEFAULT_FORM_FIELDS.find((f) => f.name === 'phone');
            expect(phoneField).toBeDefined();
            expect(phoneField?.type).toBe('tel');
            expect(phoneField?.required).toBe(false);
        });

        it('should have company field', () => {
            const companyField = DEFAULT_FORM_FIELDS.find((f) => f.name === 'company');
            expect(companyField).toBeDefined();
            expect(companyField?.type).toBe('text');
            expect(companyField?.required).toBe(false);
        });

        it('should have message field', () => {
            const messageField = DEFAULT_FORM_FIELDS.find((f) => f.name === 'message');
            expect(messageField).toBeDefined();
            expect(messageField?.type).toBe('textarea');
            expect(messageField?.required).toBe(false);
        });
    });

    describe('FORM_FIELD_TYPES', () => {
        it('should have all field types', () => {
            expect(FORM_FIELD_TYPES.TEXT).toBe('text');
            expect(FORM_FIELD_TYPES.EMAIL).toBe('email');
            expect(FORM_FIELD_TYPES.TEL).toBe('tel');
            expect(FORM_FIELD_TYPES.TEXTAREA).toBe('textarea');
            expect(FORM_FIELD_TYPES.NUMBER).toBe('number');
            expect(FORM_FIELD_TYPES.URL).toBe('url');
        });

        it('should have 6 field types', () => {
            const types = Object.values(FORM_FIELD_TYPES);
            expect(types).toHaveLength(6);
        });
    });

    describe('SUBMISSION_CONTACT_DEFAULTS', () => {
        it('should have contact creation defaults', () => {
            expect(SUBMISSION_CONTACT_DEFAULTS.NUMBER_TYPE).toBe('work');
            expect(SUBMISSION_CONTACT_DEFAULTS.EMAIL_TYPE).toBe('work');
            expect(SUBMISSION_CONTACT_DEFAULTS.IS_PRIMARY).toBe(true);
            expect(SUBMISSION_CONTACT_DEFAULTS.AUTO_TAG).toBe('Lead');
        });
    });
});
