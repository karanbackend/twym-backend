/**
 * Contact Forms Constants
 * Centralized configuration for contact forms and submissions
 */

export const CONTACT_FORMS_CONFIG = {
    RATE_LIMIT: {
        MAX_SUBMISSIONS_PER_DAY: 10,
        WINDOW_HOURS: 24,
    },
    EXPIRY: {
        DAYS: 90,
    },
    VALIDATION: {
        EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
} as const;

export type ContactFormsConfig = typeof CONTACT_FORMS_CONFIG;

/**
 * Default form field configurations
 */
export const DEFAULT_FORM_FIELDS = [
    {
        name: 'name',
        type: 'text' as const,
        label: 'Your Name',
        required: true,
    },
    {
        name: 'email',
        type: 'email' as const,
        label: 'Email',
        required: true,
    },
    {
        name: 'phone',
        type: 'tel' as const,
        label: 'Phone',
        required: false,
    },
    {
        name: 'job_title',
        type: 'text' as const,
        label: 'Job Title',
        required: false,
    },
    {
        name: 'company',
        type: 'text' as const,
        label: 'Company',
        required: false,
    },
    {
        name: 'message',
        type: 'textarea' as const,
        label: 'Message',
        required: false,
    },
] as const;

/**
 * Field type definitions
 */
export const FORM_FIELD_TYPES = {
    TEXT: 'text',
    EMAIL: 'email',
    TEL: 'tel',
    TEXTAREA: 'textarea',
    NUMBER: 'number',
    URL: 'url',
} as const;

export type FormFieldType = (typeof FORM_FIELD_TYPES)[keyof typeof FORM_FIELD_TYPES];

/**
 * Error messages
 */
export const CONTACT_FORMS_ERRORS = {
    FORM_NOT_FOUND: 'Contact form not found',
    FORM_INACTIVE: 'Contact form is not active',
    PROFILE_NOT_FOUND: 'Profile not found for user',
    SUBMISSION_NOT_FOUND: 'Submission not found',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Maximum 10 submissions per day.',
    REQUIRED_FIELD_MISSING: (fieldLabel: string) => `Required field "${fieldLabel}" is missing`,
    INVALID_EMAIL_FORMAT: (fieldLabel: string) => `Invalid email format for field "${fieldLabel}"`,
    ALREADY_CONVERTED: 'This submission has already been added to contacts',
    CONTACT_EXISTS: 'Contact already exists with this information',
} as const;

/**
 * Log messages
 */
export const CONTACT_FORMS_LOGS = {
    FORM_CREATED: (profileId: string, userId: string) =>
        `Contact form created for profile ${profileId} by user ${userId}`,
    FORM_UPDATED: (formId: string, userId: string) =>
        `Contact form ${formId} updated by user ${userId}`,
    FORM_DELETED: (formId: string, userId: string) =>
        `Contact form ${formId} deleted by user ${userId}`,
    SUBMISSION_RECEIVED: (submissionId: string, profileId: string) =>
        `Contact form submission ${submissionId} received for profile ${profileId}`,
    SUBMISSION_MARKED_READ: (submissionId: string, isRead: boolean, userId: string) =>
        `Submission ${submissionId} marked as ${isRead ? 'read' : 'unread'} by user ${userId}`,
    SUBMISSION_CONVERTED: (submissionId: string, contactId: string) =>
        `Submission ${submissionId} added to contacts as ${contactId}`,
    CLEANUP_STARTED: 'Starting cleanup of expired contact submissions',
    CLEANUP_COMPLETE: (count: number) => `Cleaned up ${count} expired submissions`,
    CLEANUP_NONE: 'No expired submissions found',
    CLEANUP_FAILED: 'Failed to cleanup expired submissions',
} as const;

/**
 * Submission field mapping to contact fields
 */
export const SUBMISSION_TO_CONTACT_FIELD_MAP = {
    name: 'name',
    email: 'emails',
    phone: 'phone_numbers',
    job_title: 'title',
    company: 'company_name',
    message: 'meeting_notes',
} as const;

export type SubmissionFieldKey = keyof typeof SUBMISSION_TO_CONTACT_FIELD_MAP;

/**
 * Contact creation defaults for submissions
 */
export const SUBMISSION_CONTACT_DEFAULTS = {
    NUMBER_TYPE: 'work' as const,
    EMAIL_TYPE: 'work' as const,
    IS_PRIMARY: true,
    AUTO_TAG: 'Lead' as const,
} as const;
