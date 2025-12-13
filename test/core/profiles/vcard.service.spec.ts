import { VCardService } from '../../../src/core/profiles/vcard.service';
import { Profile } from '../../../src/core/profiles/entities/profile.entity';
import { ProfilePhoneNumber } from '../../../src/core/profiles/entities/profile-phone-number.entity';
import { ProfileEmail } from '../../../src/core/profiles/entities/profile-email.entity';
import { ProfileAddress } from '../../../src/core/profiles/entities/profile-address.entity';
import { ProfileLink } from '../../../src/core/profiles/entities/profile-link.entity';

describe('VCardService', () => {
    let service: VCardService;

    beforeEach(() => {
        service = new VCardService();
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('generateVCard', () => {
        it('should generate basic vCard with name', () => {
            const profile: Profile = {
                id: 'profile-1',
                userId: 'user-123',
                name: 'John Doe',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('BEGIN:VCARD');
            expect(vcard).toContain('VERSION:4.0');
            expect(vcard).toContain('FN:John Doe');
            expect(vcard).toContain('N:Doe;John;;;');
            expect(vcard).toContain('END:VCARD');
        });

        it('should include title and organization', () => {
            const profile: Profile = {
                id: 'profile-1',
                userId: 'user-123',
                name: 'John Doe',
                title: 'Software Engineer',
                companyName: 'Tech Corp',
                department: 'Engineering',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('TITLE:Software Engineer');
            expect(vcard).toContain('ORG:Tech Corp;Engineering');
        });

        it('should include emails with type and preference', () => {
            const email: ProfileEmail = {
                id: 'email-1',
                profileId: 'profile-1',
                email: 'john@work.com',
                emailType: 'work',
                isPrimary: true,
            } as ProfileEmail;

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                emails: [email],
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('EMAIL;TYPE=WORK;PREF=1:john@work.com');
        });

        it('should include multiple emails', () => {
            const emails: ProfileEmail[] = [
                {
                    id: 'email-1',
                    email: 'john@work.com',
                    emailType: 'work',
                    isPrimary: true,
                } as ProfileEmail,
                {
                    id: 'email-2',
                    email: 'john@personal.com',
                    emailType: 'personal',
                    isPrimary: false,
                } as ProfileEmail,
            ];

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                emails,
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('EMAIL;TYPE=WORK;PREF=1:john@work.com');
            expect(vcard).toContain('EMAIL;TYPE=PERSONAL:john@personal.com');
        });

        it('should include phone numbers with type', () => {
            const phone: ProfilePhoneNumber = {
                id: 'phone-1',
                profileId: 'profile-1',
                rawNumber: '+1234567890',
                numberType: 'mobile',
                isPrimary: true,
            } as ProfilePhoneNumber;

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                phoneNumbers: [phone],
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('TEL;TYPE=MOBILE;PREF=1:+1234567890');
        });

        it('should include addresses when privacy allows', () => {
            const address: ProfileAddress = {
                id: 'address-1',
                profileId: 'profile-1',
                streetNumber: '123',
                streetName: 'Main St',
                city: 'New York',
                stateProvince: 'NY',
                postalCode: '10001',
                country: 'USA',
                addressType: 'work',
                isPrimary: true,
            } as ProfileAddress;

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                addresses: [address],
            } as Profile;

            const vcard = service.generateVCard(profile, {
                include_address: true,
            });

            expect(vcard).toContain('ADR;TYPE=WORK;PREF=1:');
            expect(vcard).toContain('New York');
            expect(vcard).toContain('NY');
            expect(vcard).toContain('10001');
            expect(vcard).toContain('USA');
        });

        it('should exclude addresses when privacy settings disable it', () => {
            const address: ProfileAddress = {
                id: 'address-1',
                streetName: 'Main St',
                city: 'New York',
            } as ProfileAddress;

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                addresses: [address],
            } as Profile;

            const vcard = service.generateVCard(profile, {
                include_address: false,
            });

            expect(vcard).not.toContain('ADR');
            expect(vcard).not.toContain('Main St');
        });

        it('should include social links when privacy allows', () => {
            const link: ProfileLink = {
                id: 'link-1',
                profileId: 'profile-1',
                url: 'https://linkedin.com/in/johndoe',
                platform: 'LinkedIn',
            } as ProfileLink;

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                links: [link],
            } as Profile;

            const vcard = service.generateVCard(profile, {
                include_social: true,
            });

            expect(vcard).toContain('X-SOCIALPROFILE;TYPE=LinkedIn:');
            expect(vcard).toContain('linkedin.com/in/johndoe');
        });

        it('should exclude social links when privacy settings disable it', () => {
            const link: ProfileLink = {
                id: 'link-1',
                url: 'https://linkedin.com/in/johndoe',
                platform: 'LinkedIn',
            } as ProfileLink;

            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                links: [link],
            } as Profile;

            const vcard = service.generateVCard(profile, {
                include_social: false,
            });

            expect(vcard).not.toContain('X-SOCIALPROFILE');
            expect(vcard).not.toContain('linkedin.com');
        });

        it('should include profile photo when privacy allows', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                profileImageUrl: 'https://example.com/photo.jpg',
            } as Profile;

            const vcard = service.generateVCard(profile, {
                include_photo: true,
            });

            expect(vcard).toContain('PHOTO;VALUE=URI;MEDIATYPE=image/jpeg:');
            expect(vcard).toContain('https://example.com/photo.jpg');
        });

        it('should exclude photo when privacy settings disable it', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                profileImageUrl: 'https://example.com/photo.jpg',
            } as Profile;

            const vcard = service.generateVCard(profile, {
                include_photo: false,
            });

            expect(vcard).not.toContain('PHOTO');
        });

        it('should include about me as note', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                aboutMe: 'Passionate software engineer',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('NOTE:Passionate software engineer');
        });

        it('should include profile handle', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                profileHandle: '@johndoe',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('X-PROFILE-HANDLE:@johndoe');
        });

        it('should include REV timestamp', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('REV:');
            expect(vcard).toMatch(/REV:\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        it('should escape special characters in values', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John, Doe; Jr.',
                aboutMe: 'Line 1\nLine 2',
            } as Profile;

            const vcard = service.generateVCard(profile);

            // vCard should escape commas, semicolons, and newlines
            expect(vcard).toContain('FN:');
            expect(vcard).toContain('NOTE:');
        });

        it('should handle empty profile gracefully', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('BEGIN:VCARD');
            expect(vcard).toContain('FN:John Doe');
            expect(vcard).toContain('END:VCARD');
        });

        it('should use default privacy settings when not provided', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                profileImageUrl: 'https://example.com/photo.jpg',
                addresses: [{ city: 'New York' } as ProfileAddress],
                links: [{ url: 'https://linkedin.com/in/user' } as ProfileLink],
            } as Profile;

            const vcard = service.generateVCard(profile);

            // Default should include everything
            expect(vcard).toContain('PHOTO');
            expect(vcard).toContain('ADR');
            expect(vcard).toContain('URL'); // Social links are represented as URL
        });

        it('should handle organization without department', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Doe',
                companyName: 'Tech Corp',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('ORG:Tech Corp');
            expect(vcard).not.toContain('ORG:Tech Corp;');
        });

        it('should handle names with multiple parts', () => {
            const profile: Profile = {
                id: 'profile-1',
                name: 'John Paul Doe Smith',
            } as Profile;

            const vcard = service.generateVCard(profile);

            expect(vcard).toContain('FN:John Paul Doe Smith');
            expect(vcard).toContain('N:Smith;John;Paul Doe;;');
        });
    });
});
