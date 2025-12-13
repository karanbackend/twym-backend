import { Injectable, Logger } from '@nestjs/common';
import { Profile } from './entities/profile.entity';

export interface VCardPrivacySettings {
    include_photo?: boolean;
    include_social?: boolean;
    include_address?: boolean;
}

@Injectable()
export class VCardService {
    private readonly logger = new Logger(VCardService.name);

    /**
     * Generate vCard 4.0 content from profile data
     * Respects privacy settings to include/exclude certain fields
     */
    generateVCard(profile: Profile, privacySettings?: VCardPrivacySettings | null): string {
        const settings: VCardPrivacySettings = {
            include_photo: privacySettings?.include_photo ?? true,
            include_social: privacySettings?.include_social ?? true,
            include_address: privacySettings?.include_address ?? true,
        };

        const lines: string[] = [];

        // vCard header
        lines.push('BEGIN:VCARD');
        lines.push(`VERSION:${profile.vcardVersion ?? '4.0'}`);

        // Full name (required)
        lines.push(`FN:${this.escape(profile.name)}`);

        // Structured name (N: Family;Given;Additional;Prefix;Suffix)
        const [first, ...rest] = (profile.name ?? '').split(' ');
        const last = rest.pop() ?? '';
        const middle = rest.join(' ');
        lines.push(`N:${this.escape(last)};${this.escape(first)};${this.escape(middle)};;;`);

        // Title / Role
        if (profile.title) {
            lines.push(`TITLE:${this.escape(profile.title)}`);
        }

        // Organization
        if (profile.companyName) {
            if (profile.department) {
                lines.push(
                    `ORG:${this.escape(profile.companyName)};${this.escape(profile.department)}`,
                );
            } else {
                lines.push(`ORG:${this.escape(profile.companyName)}`);
            }
        }

        // Emails
        if (profile.emails && profile.emails.length > 0) {
            for (const email of profile.emails) {
                const type = (email.emailType ?? 'WORK').toUpperCase();
                const pref = email.isPrimary ? ';PREF=1' : '';
                lines.push(`EMAIL;TYPE=${type}${pref}:${email.email}`);
            }
        }

        // Phone numbers
        if (profile.phoneNumbers && profile.phoneNumbers.length > 0) {
            for (const phone of profile.phoneNumbers) {
                const type = (phone.numberType ?? 'WORK').toUpperCase();
                const pref = phone.isPrimary ? ';PREF=1' : '';
                const number = phone.rawNumber || this.formatPhone(phone);
                lines.push(`TEL;TYPE=${type}${pref}:${number}`);
            }
        }

        // Addresses (only if privacy allows)
        if (settings.include_address && profile.addresses && profile.addresses.length > 0) {
            for (const addr of profile.addresses) {
                const type = (addr.addressType ?? 'WORK').toUpperCase();
                const pref = addr.isPrimary ? ';PREF=1' : '';
                // ADR: post-office-box;extended-address;street;locality;region;postal-code;country
                const street = [addr.streetNumber, addr.streetName].filter(Boolean).join(' ');
                const adrLine = [
                    '', // PO box
                    addr.unitSuite ?? '', // extended
                    street,
                    addr.city ?? '',
                    addr.stateProvince ?? '',
                    addr.postalCode ?? '',
                    addr.country ?? '',
                ].join(';');
                lines.push(`ADR;TYPE=${type}${pref}:${adrLine}`);
            }
        }

        // Social links / URLs (only if privacy allows)
        if (settings.include_social && profile.links && profile.links.length > 0) {
            for (const link of profile.links) {
                if (link.url) {
                    if (!['LinkedIn', 'GitHub', 'Twitter'].includes(link.platform)) {
                        // treat as general website URL
                        lines.push(`URL:${link.url}`);
                    }
                    if (link.platform) {
                        lines.push(`X-SOCIALPROFILE;TYPE=${link.platform}:${link.url}`);
                    }
                }
            }
        }

        // Profile photo URL (only if privacy allows)
        if (settings.include_photo && profile.profileImageUrl) {
            lines.push(`PHOTO;VALUE=URI;MEDIATYPE=image/jpeg:${profile.profileImageUrl}`);
        }

        // Note / About
        if (profile.aboutMe) {
            lines.push(`NOTE:${this.escape(profile.aboutMe)}`);
        }

        // Profile handle / URL
        if (profile.profileHandle) {
            lines.push(`X-PROFILE-HANDLE:${profile.profileHandle}`);
        }

        // Optional: last updated timestamp
        lines.push(`REV:${new Date().toISOString()}`);

        // vCard footer
        lines.push('END:VCARD');

        return lines.join('\r\n');
    }

    /**
     * Escape special characters in vCard values
     */
    private escape(value: string): string {
        return value
            .replace(/\\/g, '\\\\')
            .replace(/;/g, '\\;')
            .replace(/,/g, '\\,')
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '');
    }

    /**
     * Format phone number from components
     */
    private formatPhone(phone: {
        countryCode?: string | null;
        areaCode?: string | null;
        localNumber?: string | null;
        extension?: string | null;
    }): string {
        const parts: string[] = [];
        if (phone.countryCode) parts.push(`+${phone.countryCode}`);
        if (phone.areaCode) parts.push(`(${phone.areaCode})`);
        if (phone.localNumber) parts.push(phone.localNumber);
        const number = parts.join(' ');
        if (phone.extension) {
            return `${number} ext. ${phone.extension}`;
        }
        return number;
    }

    /**
     * Generate vCard QR code data URI
     */
    async generateVCardQrDataUri(vcardContent: string): Promise<string | null> {
        try {
            const QRCodeModule = await import('qrcode');
            return await QRCodeModule.toDataURL(vcardContent, {
                type: 'image/png',
                width: 400,
                errorCorrectionLevel: 'M',
            });
        } catch (e) {
            this.logger.warn(`Failed to generate vCard QR data URI: ${(e as Error).message}`);
            return null;
        }
    }
}
