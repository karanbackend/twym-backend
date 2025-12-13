import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProfilesService } from '../../../src/core/profiles/profiles.service';
import { ProfileRepository } from '../../../src/core/profiles/profile.repository';
import { UserFileService } from '../../../src/core/users/user-file.service';
import { VCardService } from '../../../src/core/profiles/vcard.service';
import { AppConfig } from '../../../src/common/config/app.config';
import { RESERVED_PROFILE_HANDLES } from '../../../src/core/profiles/profiles.constants';

describe('ProfilesService', () => {
    let service: ProfilesService;
    let mockProfileRepo: Partial<ProfileRepository>;
    let mockUserFileService: Partial<UserFileService>;
    let mockVCardService: Partial<VCardService>;
    let mockAppConfig: Partial<AppConfig>;

    beforeEach(async () => {
        mockProfileRepo = {
            create: jest.fn((data) => data),
            save: jest.fn((profile) => Promise.resolve(profile)),
            findOneById: jest.fn(),
            findOneByUserId: jest.fn(),
            findOneByProfileHandle: jest.fn(),
            findOneByDeeplinkSlug: jest.fn(),
            findAll: jest.fn(() => Promise.resolve([])),
            remove: jest.fn(),
        };

        mockUserFileService = {
            uploadProfileImage: jest.fn(),
            uploadCoverImage: jest.fn(),
        };

        mockVCardService = {
            generateVCard: jest.fn(() => 'BEGIN:VCARD\nEND:VCARD'),
            generateVCardQrDataUri: jest.fn(() => Promise.resolve('data:image/png;base64,xxx')),
        };

        mockAppConfig = {
            frontendUrl: 'https://twym.com',
            apiUrl: 'https://api.twym.com',
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProfilesService,
                { provide: ProfileRepository, useValue: mockProfileRepo },
                { provide: UserFileService, useValue: mockUserFileService },
                { provide: VCardService, useValue: mockVCardService },
                { provide: AppConfig, useValue: mockAppConfig },
                {
                    provide: 'ProfilePhoneNumberRepository',
                    useValue: { save: jest.fn(), remove: jest.fn() },
                },
                {
                    provide: 'ProfileEmailRepository',
                    useValue: { save: jest.fn(), remove: jest.fn() },
                },
                {
                    provide: 'ProfileAddressRepository',
                    useValue: { save: jest.fn(), remove: jest.fn() },
                },
                {
                    provide: 'ProfileLinkRepository',
                    useValue: { save: jest.fn(), remove: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<ProfilesService>(ProfilesService);
    });

    describe('Reserved Handle Protection', () => {
        it('should detect reserved handles in constants', () => {
            // Test that our reserved handles list includes common system handles
            expect(RESERVED_PROFILE_HANDLES).toContain('admin');
            expect(RESERVED_PROFILE_HANDLES).toContain('api');
            expect(RESERVED_PROFILE_HANDLES).toContain('auth');
            expect(RESERVED_PROFILE_HANDLES).toContain('profiles');
            expect(RESERVED_PROFILE_HANDLES.length).toBeGreaterThan(40);
        });

        it('should allow non-reserved handles', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');
            expect(result).toBeDefined();
            expect(result.profile_handle).toBeDefined();
            expect(RESERVED_PROFILE_HANDLES).not.toContain(result.profile_handle);
        });

        it('should add suffix when generated handle is reserved', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'Admin', // Would generate 'admin' which is reserved
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));

            // Mock should return null for any handle check (available)
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');

            expect(result.profile_handle).toBeDefined();
            // The handle should NOT be exactly 'admin' since it's reserved
            // It should have a suffix added
            expect(result.profile_handle).not.toBe('admin');
            expect(result.profile_handle).toMatch(/^admin-\d+$/);
        });
    });

    describe('Visibility Toggle (US-P9)', () => {
        it('should toggle profile to private', async () => {
            const existingProfile = {
                id: 'profile-123',
                userId: 'user-123',
                name: 'John Doe',
                isPublic: true,
            };

            mockProfileRepo.findOneById = jest.fn(() => Promise.resolve(existingProfile));
            mockProfileRepo.save = jest.fn((profile) => Promise.resolve(profile));

            const result = await service.updateVisibility('profile-123', 'user-123', false);

            expect(result.is_public).toBe(false);
            expect(mockProfileRepo.save).toHaveBeenCalled();
        });

        it('should toggle profile to public', async () => {
            const existingProfile = {
                id: 'profile-123',
                userId: 'user-123',
                name: 'John Doe',
                isPublic: false,
            };

            mockProfileRepo.findOneById = jest.fn(() => Promise.resolve(existingProfile));
            mockProfileRepo.save = jest.fn((profile) => Promise.resolve(profile));

            const result = await service.updateVisibility('profile-123', 'user-123', true);

            expect(result.is_public).toBe(true);
            expect(mockProfileRepo.save).toHaveBeenCalled();
        });

        it('should reject unauthorized visibility toggle', async () => {
            const existingProfile = {
                id: 'profile-123',
                userId: 'user-123',
                name: 'John Doe',
                isPublic: true,
            };

            mockProfileRepo.findOneById = jest.fn(() => Promise.resolve(existingProfile));

            await expect(
                service.updateVisibility('profile-123', 'different-user', false),
            ).rejects.toThrow();
        });

        it('should throw NotFoundException for non-existent profile', async () => {
            mockProfileRepo.findOneById = jest.fn(() => Promise.resolve(null));

            await expect(
                service.updateVisibility('nonexistent', 'user-123', false),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('Tag Validation (US-P5)', () => {
        it('should accept tags within limits', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
                profile_tags: ['developer', 'speaker', 'open-source'],
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');
            expect(result.profile_tags).toEqual(['developer', 'speaker', 'open-source']);
        });

        it('should accept maximum of 20 tags', async () => {
            const tags = Array.from({ length: 20 }, (_, i) => `tag${i + 1}`);
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
                profile_tags: tags,
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');
            expect(result.profile_tags).toHaveLength(20);
        });

        it('should accept tags with max 25 characters', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
                profile_tags: ['a'.repeat(25)],
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');
            expect(result.profile_tags?.[0]).toHaveLength(25);
        });
    });

    describe('QR Code Generation', () => {
        it('should generate profile QR code URL on creation', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');

            expect(result.profile_qr_code_url).toBeDefined();
            expect(result.profile_qr_code_url).toContain('/profiles/');
            expect(result.profile_qr_code_url).toContain('page-qr.png');
        });

        it('should generate vCard QR code URL on creation', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');

            expect(result.vcard_qr_code_url).toBeDefined();
            expect(result.vcard_qr_code_url).toContain('/profiles/');
            expect(result.vcard_qr_code_url).toContain('vcard-qr.png');
        });
    });

    describe('vCard Privacy Settings (US-P8)', () => {
        it('should update vCard privacy settings', async () => {
            const existingProfile = {
                id: 'profile-123',
                userId: 'user-123',
                name: 'John Doe',
                vcardPrivacySettings: {
                    include_photo: true,
                    include_social: true,
                    include_address: true,
                },
            };

            mockProfileRepo.findOneById = jest.fn(() => Promise.resolve(existingProfile));
            mockProfileRepo.save = jest.fn((profile) => Promise.resolve(profile));

            const privacyDto = {
                include_photo: false,
                include_social: true,
                include_address: false,
            };

            const result = await service.updateVCardPrivacySettings(
                'profile-123',
                'user-123',
                privacyDto,
            );

            expect(result.vcard_privacy_settings).toEqual({
                include_photo: false,
                include_social: true,
                include_address: false,
            });
        });

        it('should initialize default privacy settings on creation', async () => {
            const createDto = {
                user_id: 'user-123',
                name: 'John Doe',
            };

            mockProfileRepo.findOneByUserId = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByProfileHandle = jest.fn(() => Promise.resolve(null));
            mockProfileRepo.findOneByDeeplinkSlug = jest.fn(() => Promise.resolve(null));

            const result = await service.create(createDto, 'user-123');

            expect(result.vcard_privacy_settings).toEqual({
                include_photo: true,
                include_social: true,
                include_address: true,
            });
        });
    });
});
