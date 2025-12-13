export class ContactSubmissionResponseDto {
    id: string;
    formId: string;
    profileId: string;
    submissionData: Record<string, any>;
    createdContactId: string | null;
    visitorIp: string | null;
    userAgent: string | null;
    referrer: string | null;
    captchaVerified: boolean | null;
    isRead: boolean | null;
    expiresAt: Date | null;
    createdAt: Date;
}
