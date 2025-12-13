/**
 * Contact Forms Types
 * Reusable type definitions for contact forms domain
 */

import type { FormFieldType } from '../contact-forms.constants';

/**
 * Form field validation configuration
 */
export interface FormFieldValidation {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
}

/**
 * Complete form field structure
 */
export interface FormFieldDefinition {
    name: string;
    type: FormFieldType;
    label: string;
    required: boolean;
    placeholder?: string;
    validation?: FormFieldValidation;
}

/**
 * Submission metadata captured from visitor
 */
export interface SubmissionMetadata {
    visitorIp?: string | null;
    userAgent?: string | null;
    referrer?: string | null;
    captchaVerified?: boolean;
}

/**
 * Submission data structure (visitor input)
 */
export interface SubmissionData {
    [key: string]: unknown;
    name?: string;
    email?: string;
    phone?: string;
    job_title?: string;
    company?: string;
    message?: string;
}

/**
 * Contact conversion result
 */
export interface ContactConversionResult {
    contactId: string;
    submissionId: string;
    convertedAt: Date;
}

/**
 * Rate limit check result
 */
export interface RateLimitCheckResult {
    allowed: boolean;
    currentCount: number;
    limit: number;
    remainingSubmissions?: number;
}

/**
 * Submission statistics
 */
export interface SubmissionStats {
    total: number;
    unread: number;
    converted: number;
    expired: number;
}

/**
 * Form validation result
 */
export interface FormValidationResult {
    valid: boolean;
    errors: Array<{
        field: string;
        message: string;
    }>;
}

/**
 * Cleanup job result
 */
export interface CleanupJobResult {
    success: boolean;
    deletedCount: number;
    error?: string;
}
