import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import { ProfilesController } from '../../../src/core/profiles/profiles.controller';
import { ProfilesService } from '../../../src/core/profiles/profiles.service';
import { SupabaseAuthGuard } from '../../../src/common/auth/supabase/supabase-auth.guard';
import { CreateProfileDto } from '../../../src/core/profiles/dto/create-profile.dto';
import { UpdateProfileDto } from '../../../src/core/profiles/dto/update-profile.dto';
import { CreateProfileEmailDto } from '../../../src/core/profiles/dto/create-profile-email.dto';
import { CreateProfilePhoneNumberDto } from '../../../src/core/profiles/dto/create-profile-phone-number.dto';
import { CreateProfileAddressDto } from '../../../src/core/profiles/dto/create-profile-address.dto';
import { CreateProfileLinkDto } from '../../../src/core/profiles/dto/create-profile-link.dto';
import { UpdateProfileEmailDto } from '../../../src/core/profiles/dto/update-profile-email.dto';
import { UpdateProfilePhoneNumberDto } from '../../../src/core/profiles/dto/update-profile-phone-number.dto';
import { UpdateProfileAddressDto } from '../../../src/core/profiles/dto/update-profile-address.dto';
import { UpdateProfileLinkDto } from '../../../src/core/profiles/dto/update-profile-link.dto';
import { SetPrimaryFlagDto } from '../../../src/core/profiles/dto/set-primary-flag.dto';
import { BulkDeleteDto } from '../../../src/core/profiles/dto/bulk-delete.dto';
import { UpdateVCardPrivacyDto } from '../../../src/core/profiles/dto/update-vcard-privacy.dto';

describe('ProfilesController', () => {
    let controller: ProfilesController;
    let service: jest.Mocked<ProfilesService>;

    const mockAuthUser = { id: 'user-123' };
    const mockProfileId = 'profile-123';
    const mockUserId = 'user-456';
    const mockHandle = 'john-doe';
    const mockSlug = 'abc123';

    const mockProfile = {
        id: mockProfileId,
        user_id: mockUserId,
        profile_handle: mockHandle,
        deeplink_slug: mockSlug,
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Inc',
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(async () => {
        const mockService = {
            create: jest.fn(),
            findAll: jest.fn(),
            findByUserId: jest.fn(),
            findByProfileHandle: jest.fn(),
            findByDeeplinkSlug: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            uploadProfileImage: jest.fn(),
            uploadCoverImage: jest.fn(),
            createEmails: jest.fn(),
            updateEmails: jest.fn(),
            removeEmails: jest.fn(),
            setPrimaryEmail: jest.fn(),
            createPhoneNumbers: jest.fn(),
            updatePhoneNumbers: jest.fn(),
            removePhoneNumbers: jest.fn(),
            setPrimaryPhoneNumber: jest.fn(),
            createAddresses: jest.fn(),
            updateAddresses: jest.fn(),
            removeAddresses: jest.fn(),
            setPrimaryAddress: jest.fn(),
            createLinks: jest.fn(),
            updateLinks: jest.fn(),
            removeLinks: jest.fn(),
            updateVCardPrivacySettings: jest.fn(),
            generateVCard: jest.fn(),
            getVCard: jest.fn(),
            getVCardByHandle: jest.fn(),
            generateProfileQrCode: jest.fn(),
            generateVCardQrCode: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ProfilesController],
            providers: [
                {
                    provide: ProfilesService,
                    useValue: mockService,
                },
            ],
        })
            .overrideGuard(SupabaseAuthGuard)
            .useValue({ canActivate: jest.fn(() => true) })
            .compile();

        controller = module.get<ProfilesController>(ProfilesController);
        service = module.get(ProfilesService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    // -------------------- PROFILE CRUD --------------------

    describe('create', () => {
        it('should create a profile', async () => {
            const createDto: CreateProfileDto = {
                first_name: 'John',
                last_name: 'Doe',
                profile_handle: mockHandle,
            };

            service.create.mockResolvedValue(mockProfile);

            const result = await controller.create(createDto, mockAuthUser);

            expect(service.create).toHaveBeenCalledWith(createDto, mockAuthUser.id);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('findAll', () => {
        it('should find all profiles', async () => {
            const profiles = [mockProfile];
            service.findAll.mockResolvedValue(profiles);

            const result = await controller.findAll();

            expect(service.findAll).toHaveBeenCalled();
            expect(result).toEqual(profiles);
        });
    });

    describe('findByUserId', () => {
        it('should find profile by user id', async () => {
            service.findByUserId.mockResolvedValue(mockProfile);

            const result = await controller.findByUserId(mockUserId);

            expect(service.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('findByProfileHandle', () => {
        it('should find profile by handle', async () => {
            service.findByProfileHandle.mockResolvedValue(mockProfile);

            const result = await controller.findByProfileHandle(mockHandle);

            expect(service.findByProfileHandle).toHaveBeenCalledWith(mockHandle);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('findByDeeplinkSlug', () => {
        it('should find profile by deeplink slug', async () => {
            service.findByDeeplinkSlug.mockResolvedValue(mockProfile);

            const result = await controller.findByDeeplinkSlug(mockSlug);

            expect(service.findByDeeplinkSlug).toHaveBeenCalledWith(mockSlug);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('findOne', () => {
        it('should find one profile by id', async () => {
            service.findOne.mockResolvedValue(mockProfile);

            const result = await controller.findOne(mockProfileId);

            expect(service.findOne).toHaveBeenCalledWith(mockProfileId);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('update', () => {
        it('should update a profile', async () => {
            const updateDto: UpdateProfileDto = {
                first_name: 'Jane',
                company: 'New Company',
            };

            const updatedProfile = { ...mockProfile, ...updateDto };
            service.update.mockResolvedValue(updatedProfile);

            const result = await controller.update(mockProfileId, updateDto, mockAuthUser);

            expect(service.update).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, updateDto);
            expect(result).toEqual(updatedProfile);
        });
    });

    describe('remove', () => {
        it('should delete a profile', async () => {
            service.remove.mockResolvedValue(undefined);

            const result = await controller.remove(mockProfileId, mockAuthUser);

            expect(service.remove).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id);
            expect(result).toBeUndefined();
        });
    });

    // -------------------- AVATAR --------------------

    describe('uploadProfile', () => {
        it('should upload profile image', async () => {
            const file: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'profile.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const updatedProfile = {
                ...mockProfile,
                profile_image_url: 'https://example.com/profile.jpg',
            };
            service.uploadProfileImage.mockResolvedValue(updatedProfile);

            const result = await controller.uploadProfile(mockProfileId, file, mockAuthUser);

            expect(service.uploadProfileImage).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                file,
            );
            expect(result).toEqual(updatedProfile);
        });
    });

    describe('uploadCoverImage', () => {
        it('should upload cover image', async () => {
            const file: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'cover.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const updatedProfile = {
                ...mockProfile,
                cover_image_url: 'https://example.com/cover.jpg',
            };
            service.uploadCoverImage.mockResolvedValue(updatedProfile);

            const result = await controller.uploadCoverImage(mockProfileId, file, mockAuthUser);

            expect(service.uploadCoverImage).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                file,
            );
            expect(result).toEqual(updatedProfile);
        });
    });

    // -------------------- EMAILS --------------------

    describe('createEmails', () => {
        it('should create emails for profile', async () => {
            const dto: CreateProfileEmailDto = {
                emails: [
                    {
                        email: 'john@example.com',
                        label: 'work',
                        is_primary: true,
                    },
                ],
            };

            service.createEmails.mockResolvedValue(mockProfile);

            const result = await controller.createEmails(mockProfileId, dto, mockAuthUser);

            expect(service.createEmails).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, dto);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('updateEmails', () => {
        it('should update emails', async () => {
            const dto: UpdateProfileEmailDto = {
                emails: [
                    {
                        id: 'email-123',
                        email: 'jane@example.com',
                        label: 'personal',
                    },
                ],
            };

            service.updateEmails.mockResolvedValue(mockProfile);

            const result = await controller.updateEmails(mockProfileId, dto, mockAuthUser);

            expect(service.updateEmails).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, dto);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('deleteEmails', () => {
        it('should delete emails', async () => {
            const dto: BulkDeleteDto = { ids: ['email-123', 'email-456'] };

            service.removeEmails.mockResolvedValue(undefined);

            const result = await controller.deleteEmails(mockProfileId, dto, mockAuthUser);

            expect(service.removeEmails).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, dto);
            expect(result).toBeUndefined();
        });
    });

    describe('setPrimaryEmail', () => {
        it('should set primary email', async () => {
            const emailId = 'email-123';
            const dto: SetPrimaryFlagDto = { isPrimary: true };

            service.setPrimaryEmail.mockResolvedValue(mockProfile);

            const result = await controller.setPrimaryEmail(
                mockProfileId,
                emailId,
                dto,
                mockAuthUser,
            );

            expect(service.setPrimaryEmail).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                emailId,
                true,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    // -------------------- PHONE NUMBERS --------------------

    describe('createPhoneNumbers', () => {
        it('should create phone numbers for profile', async () => {
            const dto: CreateProfilePhoneNumberDto = {
                phone_numbers: [
                    {
                        phone_number: '+1234567890',
                        label: 'mobile',
                        is_primary: true,
                    },
                ],
            };

            service.createPhoneNumbers.mockResolvedValue(mockProfile);

            const result = await controller.createPhoneNumbers(mockProfileId, dto, mockAuthUser);

            expect(service.createPhoneNumbers).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    describe('updatePhoneNumbers', () => {
        it('should update phone numbers', async () => {
            const dto: UpdateProfilePhoneNumberDto = {
                phone_numbers: [
                    {
                        id: 'phone-123',
                        phone_number: '+0987654321',
                        label: 'work',
                    },
                ],
            };

            service.updatePhoneNumbers.mockResolvedValue(mockProfile);

            const result = await controller.updatePhoneNumbers(mockProfileId, dto, mockAuthUser);

            expect(service.updatePhoneNumbers).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    describe('deletePhoneNumbers', () => {
        it('should delete phone numbers', async () => {
            const dto: BulkDeleteDto = { ids: ['phone-123', 'phone-456'] };

            service.removePhoneNumbers.mockResolvedValue(undefined);

            const result = await controller.deletePhoneNumbers(mockProfileId, dto, mockAuthUser);

            expect(service.removePhoneNumbers).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toBeUndefined();
        });
    });

    describe('setPrimaryPhoneNumber', () => {
        it('should set primary phone number', async () => {
            const phoneNumberId = 'phone-123';
            const dto: SetPrimaryFlagDto = { isPrimary: true };

            service.setPrimaryPhoneNumber.mockResolvedValue(mockProfile);

            const result = await controller.setPrimaryPhoneNumber(
                mockProfileId,
                phoneNumberId,
                dto,
                mockAuthUser,
            );

            expect(service.setPrimaryPhoneNumber).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                phoneNumberId,
                true,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    // -------------------- ADDRESSES --------------------

    describe('createAddresses', () => {
        it('should create addresses for profile', async () => {
            const dto: CreateProfileAddressDto = {
                addresses: [
                    {
                        street: '123 Main St',
                        city: 'New York',
                        country: 'USA',
                        label: 'work',
                        is_primary: true,
                    },
                ],
            };

            service.createAddresses.mockResolvedValue(mockProfile);

            const result = await controller.createAddresses(mockProfileId, dto, mockAuthUser);

            expect(service.createAddresses).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    describe('updateAddresses', () => {
        it('should update addresses', async () => {
            const addressId = 'address-123';
            const dto: UpdateProfileAddressDto = {
                addresses: [
                    {
                        id: addressId,
                        street: '456 Oak Ave',
                        city: 'Los Angeles',
                        country: 'USA',
                    },
                ],
            };

            service.updateAddresses.mockResolvedValue(mockProfile);

            const result = await controller.updateAddresses(
                mockProfileId,
                addressId,
                dto,
                mockAuthUser,
            );

            expect(service.updateAddresses).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    describe('deleteAddresses', () => {
        it('should delete addresses', async () => {
            const dto: BulkDeleteDto = { ids: ['address-123', 'address-456'] };

            service.removeAddresses.mockResolvedValue(undefined);

            const result = await controller.deleteAddresses(mockProfileId, dto, mockAuthUser);

            expect(service.removeAddresses).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toBeUndefined();
        });
    });

    describe('setPrimaryAddress', () => {
        it('should set primary address', async () => {
            const addressId = 'address-123';
            const dto: SetPrimaryFlagDto = { isPrimary: true };

            service.setPrimaryAddress.mockResolvedValue(mockProfile);

            const result = await controller.setPrimaryAddress(
                mockProfileId,
                addressId,
                dto,
                mockAuthUser,
            );

            expect(service.setPrimaryAddress).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                addressId,
                true,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    // -------------------- LINKS --------------------

    describe('createLinks', () => {
        it('should create links for profile', async () => {
            const dto: CreateProfileLinkDto = {
                links: [
                    {
                        url: 'https://linkedin.com/in/johndoe',
                        label: 'LinkedIn',
                        platform: 'linkedin',
                    },
                ],
            };

            service.createLinks.mockResolvedValue(mockProfile);

            const result = await controller.createLinks(mockProfileId, dto, mockAuthUser);

            expect(service.createLinks).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, dto);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('updateLinks', () => {
        it('should update links', async () => {
            const dto: UpdateProfileLinkDto = {
                links: [
                    {
                        id: 'link-123',
                        url: 'https://twitter.com/johndoe',
                        label: 'Twitter',
                    },
                ],
            };

            service.updateLinks.mockResolvedValue(mockProfile);

            const result = await controller.updateLinks(mockProfileId, dto, mockAuthUser);

            expect(service.updateLinks).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, dto);
            expect(result).toEqual(mockProfile);
        });
    });

    describe('deleteLinks', () => {
        it('should delete links', async () => {
            const dto: BulkDeleteDto = { ids: ['link-123', 'link-456'] };

            service.removeLinks.mockResolvedValue(undefined);

            const result = await controller.deleteLinks(mockProfileId, dto, mockAuthUser);

            expect(service.removeLinks).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id, dto);
            expect(result).toBeUndefined();
        });
    });

    // -------------------- VCARD --------------------

    describe('updateVCardPrivacy', () => {
        it('should update vCard privacy settings', async () => {
            const dto: UpdateVCardPrivacyDto = {
                vcard_include_photo: true,
                vcard_include_social_links: false,
                vcard_include_addresses: true,
            };

            service.updateVCardPrivacySettings.mockResolvedValue(mockProfile);

            const result = await controller.updateVCardPrivacy(mockProfileId, dto, mockAuthUser);

            expect(service.updateVCardPrivacySettings).toHaveBeenCalledWith(
                mockProfileId,
                mockAuthUser.id,
                dto,
            );
            expect(result).toEqual(mockProfile);
        });
    });

    describe('generateMyVCard', () => {
        it('should generate vCard with QR code', async () => {
            const vCardData = {
                vcard: 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD',
                qrCode: 'data:image/png;base64,abc123',
            };

            service.generateVCard.mockResolvedValue(vCardData);

            const result = await controller.generateMyVCard(mockProfileId, mockAuthUser);

            expect(service.generateVCard).toHaveBeenCalledWith(mockProfileId, mockAuthUser.id);
            expect(result).toEqual(vCardData);
        });
    });

    describe('downloadVCard', () => {
        it('should download vCard by profile id', async () => {
            const vCardContent = 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD';

            service.getVCard.mockResolvedValue(vCardContent);

            const result = await controller.downloadVCard(mockProfileId);

            expect(service.getVCard).toHaveBeenCalledWith(mockProfileId);
            expect(result).toEqual(vCardContent);
        });
    });

    describe('downloadVCardByHandle', () => {
        it('should download vCard by profile handle', async () => {
            const vCardContent = 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD';

            service.getVCardByHandle.mockResolvedValue(vCardContent);

            const result = await controller.downloadVCardByHandle(mockHandle);

            expect(service.getVCardByHandle).toHaveBeenCalledWith(mockHandle);
            expect(result).toEqual(vCardContent);
        });
    });

    // -------------------- QR CODE IMAGES --------------------

    describe('getProfileQrCode', () => {
        it('should get profile page QR code image', async () => {
            const qrBuffer = Buffer.from('png-image-data');
            service.generateProfileQrCode.mockResolvedValue(qrBuffer);

            const mockResponse = {
                setHeader: jest.fn(),
                send: jest.fn(),
            } as unknown as Response;

            await controller.getProfileQrCode(mockHandle, mockResponse);

            expect(service.generateProfileQrCode).toHaveBeenCalledWith(mockHandle);
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'public, max-age=3600',
            );
            expect(mockResponse.send).toHaveBeenCalledWith(qrBuffer);
        });
    });

    describe('getVCardQrCode', () => {
        it('should get vCard QR code image', async () => {
            const qrBuffer = Buffer.from('png-image-data');
            service.generateVCardQrCode.mockResolvedValue(qrBuffer);

            const mockResponse = {
                setHeader: jest.fn(),
                send: jest.fn(),
            } as unknown as Response;

            await controller.getVCardQrCode(mockHandle, mockResponse);

            expect(service.generateVCardQrCode).toHaveBeenCalledWith(mockHandle);
            expect(mockResponse.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
            expect(mockResponse.setHeader).toHaveBeenCalledWith(
                'Cache-Control',
                'public, max-age=3600',
            );
            expect(mockResponse.send).toHaveBeenCalledWith(qrBuffer);
        });
    });
});
