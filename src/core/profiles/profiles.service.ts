import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileResponseDto } from './dto/profile-response.dto';
import { ProfileRepository } from './profile.repository';
import { ProfileMapper } from './profile.mapper';
import { Profile } from './entities/profile.entity';
import { ProfilePhoneNumber } from './entities/profile-phone-number.entity';
import { ProfileEmail } from './entities/profile-email.entity';
import { ProfileAddress } from './entities/profile-address.entity';
import { ProfileLink } from './entities/profile-link.entity';
import { UserFileService } from '../users/user-file.service';
import { UploadUserFileResponseDto } from '../users/dto/upload-user-file-response.dto';
import { CreateProfileEmailDto } from './dto/create-profile-email.dto';
import { CreateProfilePhoneNumberDto } from './dto/create-profile-phone-number.dto';
import { CreateProfileAddressDto } from './dto/create-profile-address.dto';
import { CreateProfileLinkDto } from './dto/create-profile-link.dto';
import { UpdateProfileEmailDto } from './dto/update-profile-email.dto';
import { UpdateProfilePhoneNumberDto } from './dto/update-profile-phone-number.dto';
import { UpdateProfileAddressDto } from './dto/update-profile-address.dto';
import { UpdateProfileLinkDto } from './dto/update-profile-link.dto';
import { BulkDeleteDto } from './dto/bulk-delete.dto';
import { ProfileEmailResponseDto } from './dto/profile-email-response.dto';
import { ProfilePhoneNumberResponseDto } from './dto/profile-phone-number-response.dto';
import { ProfileAddressResponseDto } from './dto/profile-address-response.dto';
import { ProfileLinkResponseDto } from './dto/profile-link-response.dto';
import { ProfileUtil } from './profile.util';
import { AppConfig } from '../../common/config/app.config';
import { VCardService } from './vcard.service';
import { UpdateVCardPrivacyDto } from './dto/update-vcard-privacy.dto';
import { RESERVED_PROFILE_HANDLES } from './profiles.constants';
import * as QRCode from 'qrcode';

type VCardPrivacySettings = {
    include_photo?: boolean;
    include_social?: boolean;
    include_address?: boolean;
};

const PROFILE_NOT_FOUND = 'Profile not found';

@Injectable()
export class ProfilesService {
    private readonly logger = new Logger(ProfilesService.name);

    constructor(
        private readonly repo: ProfileRepository,
        private readonly userFileService: UserFileService,
        private readonly vcardService: VCardService,
        @InjectRepository(ProfilePhoneNumber)
        private readonly phoneNumberRepo: Repository<ProfilePhoneNumber>,
        @InjectRepository(ProfileEmail)
        private readonly emailRepo: Repository<ProfileEmail>,
        @InjectRepository(ProfileAddress)
        private readonly addressRepo: Repository<ProfileAddress>,
        @InjectRepository(ProfileLink)
        private readonly linkRepo: Repository<ProfileLink>,
        private readonly appConfig: AppConfig,
    ) {}

    // ----------------------
    // Profile CRUD
    // ----------------------
    async create(createProfileDto: CreateProfileDto, userId: string): Promise<ProfileResponseDto> {
        this.logger.log(`Creating profile for user: ${userId}`);
        const mapped = ProfileMapper.mapToEntity({
            ...createProfileDto,
            user_id: userId,
        });

        if (!mapped.userId) {
            throw new BadRequestException('userId is required');
        }

        const existing = await this.repo.findOneByUserId(mapped.userId);
        if (existing) {
            throw new BadRequestException('Profile for user already exists');
        }

        if (!mapped.name) {
            throw new BadRequestException('Name is required to generate profile handle');
        }
        mapped.profileHandle = await this.generateUniqueProfileHandle(mapped.name);
        this.logger.log(`Generated profile handle: ${mapped.profileHandle}`);

        mapped.deeplinkSlug = await this.generateUniqueDeeplinkSlug(mapped.name);
        this.logger.log(`Generated deeplink slug: ${mapped.deeplinkSlug}`);

        mapped.profileQrCodeUrl = this.generateQrCodeUrl(mapped.profileHandle);

        this.initializeVCardSettings(mapped);

        await this.validateUniqueFields(mapped);
        this.validatePrimaryFlags(mapped);

        const entity = this.repo.create(mapped);
        const saved = await this.repo.save(entity);

        this.logger.log(`Profile created successfully with id: ${saved.id}`);
        return ProfileMapper.mapToDto(saved, this.appConfig.frontendUrl);
    }

    async findAll(): Promise<ProfileResponseDto[]> {
        const rows = await this.repo.findAll();
        return rows.map((r) => ProfileMapper.mapToDto(r, this.appConfig.frontendUrl));
    }

    async findOne(id: string): Promise<ProfileResponseDto> {
        const profile = await this.repo.findOneById(id);
        if (!profile) throw new NotFoundException(PROFILE_NOT_FOUND);
        return ProfileMapper.mapToDto(profile, this.appConfig.frontendUrl);
    }

    async findByUserId(userId: string): Promise<ProfileResponseDto> {
        const profile = await this.repo.findOneByUserId(userId);
        if (!profile) throw new NotFoundException(PROFILE_NOT_FOUND);
        return ProfileMapper.mapToDto(profile, this.appConfig.frontendUrl);
    }

    async findByProfileHandle(handle: string): Promise<ProfileResponseDto> {
        const profile = await this.repo.findOneByProfileHandle(handle);
        if (!profile) throw new NotFoundException(PROFILE_NOT_FOUND);
        return ProfileMapper.mapToDto(profile, this.appConfig.frontendUrl);
    }

    async findByDeeplinkSlug(slug: string): Promise<ProfileResponseDto> {
        const profile = await this.repo.findOneByDeeplinkSlug(slug);
        if (!profile) throw new NotFoundException(PROFILE_NOT_FOUND);
        return ProfileMapper.mapToDto(profile, this.appConfig.frontendUrl);
    }

    private async getOwnedProfileOrThrow(profileId: string, userId: string): Promise<Profile> {
        const profile = await this.repo.findOneById(profileId);
        if (!profile) throw new NotFoundException(PROFILE_NOT_FOUND);
        if (profile.userId !== userId) {
            throw new ForbiddenException('You do not own this profile');
        }
        return profile;
    }

    async update(
        id: string,
        userId: string,
        updateProfileDto: UpdateProfileDto,
    ): Promise<ProfileResponseDto> {
        this.logger.log(`Updating profile with id: ${id}`);
        const existingProfile = await this.getOwnedProfileOrThrow(id, userId);
        const mappedUpdate = ProfileMapper.mapToEntity(updateProfileDto);

        if (mappedUpdate.userId && mappedUpdate.userId !== existingProfile.userId) {
            const existing = await this.repo.findOneByUserId(mappedUpdate.userId);
            if (existing && existing.id !== id) {
                throw new BadRequestException('Profile for user already exists');
            }
        }

        // If profileHandle is being changed, update QR code URLs accordingly
        if (mappedUpdate.profileHandle) {
            mappedUpdate.profileQrCodeUrl = this.generateQrCodeUrl(mappedUpdate.profileHandle);
            mappedUpdate.vcardQrCodeUrl = this.generateVCardQrCodeUrl(mappedUpdate.profileHandle);
            // Mark vCard as needing regeneration
            mappedUpdate.vcardLastGenerated = null;
        }

        await this.validateUniqueFields(mappedUpdate, id);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { phoneNumbers, emails, addresses, links, ...scalarFields } = mappedUpdate;
        Object.assign(existingProfile, scalarFields);

        const saved = await this.repo.save(existingProfile);
        this.logger.log(`Profile updated successfully with id: ${id}`);

        return ProfileMapper.mapToDto(saved, this.appConfig.frontendUrl);
    }

    async remove(id: string, userId: string): Promise<void> {
        this.logger.log(`Removing profile with id: ${id}`);
        const profile = await this.getOwnedProfileOrThrow(id, userId);
        await this.repo.remove(profile);
        this.logger.log(`Profile removed successfully with id: ${id}`);
    }

    /**
     * US-P9: Toggle profile visibility between public and private
     * Public = anyone with link can view
     * Private = only owner can view
     */
    async updateVisibility(
        id: string,
        userId: string,
        isPublic: boolean,
    ): Promise<ProfileResponseDto> {
        this.logger.log(
            `Updating profile visibility for profile: ${id} to ${isPublic ? 'public' : 'private'}`,
        );
        const profile = await this.getOwnedProfileOrThrow(id, userId);

        profile.isPublic = isPublic;
        const saved = await this.repo.save(profile);

        this.logger.log(`Profile visibility updated successfully for profile: ${id}`);
        return ProfileMapper.mapToDto(saved, this.appConfig.frontendUrl);
    }

    // ----------------------
    // Emails
    // ----------------------
    async createEmails(
        profileId: string,
        userId: string,
        dto: CreateProfileEmailDto,
    ): Promise<ProfileEmailResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        const newEmails = dto.items.map((item) => ProfileMapper.mapEmailDtoToEntity(item));
        profile.emails = [...(profile.emails || []), ...newEmails];
        this.validatePrimaryFlags(profile);
        const saved = await this.repo.save(profile);
        return (saved.emails ?? []).map((email) => ProfileMapper.mapEmailToDto(email));
    }

    async updateEmails(
        profileId: string,
        userId: string,
        dto: UpdateProfileEmailDto,
    ): Promise<ProfileEmailResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.emails || !profile.emails.length || !dto.items || !dto.items.length) {
            throw new NotFoundException('No emails found for this profile');
        }

        const emailMap = new Map(profile.emails.map((email) => [email.id, email]));

        for (const emailDto of dto.items) {
            if (!emailDto.id) {
                throw new BadRequestException('Email ID is required for update');
            }

            const existingEmail = emailMap.get(emailDto.id);
            if (!existingEmail) {
                throw new NotFoundException(`Email with id ${emailDto.id} not found`);
            }
            const updatedData = ProfileMapper.mapEmailDtoToEntity(emailDto);
            Object.assign(existingEmail, updatedData);
        }

        this.validatePrimaryFlags(profile);

        const saved = await this.repo.save(profile);
        return (saved.emails ?? []).map((email) => ProfileMapper.mapEmailToDto(email));
    }

    async removeEmails(
        profileId: string,
        userId: string,
        dto: BulkDeleteDto,
    ): Promise<ProfileEmailResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.emails || profile.emails.length === 0) {
            throw new NotFoundException('No emails found for this profile');
        }

        const idsToDelete = new Set(dto.ids);
        const emailsToDelete = profile.emails.filter((email) => idsToDelete.has(email.id));

        if (emailsToDelete.length === 0) {
            throw new NotFoundException('None of the specified emails found');
        }

        await this.emailRepo.remove(emailsToDelete);

        const updatedProfile = await this.repo.findOneById(profileId);
        if (!updatedProfile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }

        return (updatedProfile.emails ?? []).map((email) => ProfileMapper.mapEmailToDto(email));
    }

    async setPrimaryEmail(
        profileId: string,
        userId: string,
        emailId: string,
        isPrimary: boolean,
    ): Promise<ProfileEmailResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        let found = false;
        for (const email of profile.emails || []) {
            if (email.id === emailId) {
                email.isPrimary = isPrimary;
                found = true;
            } else if (isPrimary) {
                email.isPrimary = false;
            }
        }
        if (!found) {
            throw new NotFoundException(`Email with id ${emailId} not found`);
        }
        const saved = await this.repo.save(profile);
        return (saved.emails ?? []).map((email) => ProfileMapper.mapEmailToDto(email));
    }

    // ----------------------
    // Phone Numbers
    // ----------------------
    async createPhoneNumbers(
        profileId: string,
        userId: string,
        dto: CreateProfilePhoneNumberDto,
    ): Promise<ProfilePhoneNumberResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        const newPhoneNumbers = dto.items.map((item) =>
            ProfileMapper.mapPhoneNumberDtoToEntity(item),
        );
        profile.phoneNumbers = [...(profile.phoneNumbers || []), ...newPhoneNumbers];
        this.validatePrimaryFlags(profile);
        const saved = await this.repo.save(profile);
        return (saved.phoneNumbers ?? []).map((phone) => ProfileMapper.mapPhoneNumberToDto(phone));
    }

    async updatePhoneNumbers(
        profileId: string,
        userId: string,
        dto: UpdateProfilePhoneNumberDto,
    ): Promise<ProfilePhoneNumberResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (
            !profile.phoneNumbers ||
            !profile.phoneNumbers.length ||
            !dto.items ||
            !dto.items.length
        ) {
            throw new NotFoundException('No phoneNumbers found for this profile');
        }

        if (!profile.phoneNumbers || profile.phoneNumbers.length === 0) {
            throw new NotFoundException('No phone numbers found for this profile');
        }

        const phoneNumberMap = new Map(
            profile.phoneNumbers.map((phoneNumber) => [phoneNumber.id, phoneNumber]),
        );

        for (const phoneNumberDto of dto.items) {
            if (!phoneNumberDto.id) {
                throw new BadRequestException('Phone number ID is required for update');
            }

            const existingPhoneNumber = phoneNumberMap.get(phoneNumberDto.id);
            if (!existingPhoneNumber) {
                throw new NotFoundException(`Phone number with id ${phoneNumberDto.id} not found`);
            }

            const updatedData = ProfileMapper.mapPhoneNumberDtoToEntity(phoneNumberDto);
            Object.assign(existingPhoneNumber, updatedData);
        }

        this.validatePrimaryFlags(profile);

        const savedProfile = await this.repo.save(profile);
        return (savedProfile.phoneNumbers ?? []).map((phone) =>
            ProfileMapper.mapPhoneNumberToDto(phone),
        );
    }

    async removePhoneNumbers(
        profileId: string,
        userId: string,
        dto: BulkDeleteDto,
    ): Promise<ProfilePhoneNumberResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.phoneNumbers || profile.phoneNumbers.length === 0) {
            throw new NotFoundException('No phone numbers found for this profile');
        }

        const idsToDelete = new Set(dto.ids);
        const phoneNumbersToDelete = profile.phoneNumbers.filter((phoneNumber) =>
            idsToDelete.has(phoneNumber.id),
        );

        if (phoneNumbersToDelete.length === 0) {
            throw new NotFoundException('None of the specified phone numbers found');
        }

        await this.phoneNumberRepo.remove(phoneNumbersToDelete);

        const updatedProfile = await this.repo.findOneById(profileId);
        if (!updatedProfile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }

        return (updatedProfile.phoneNumbers ?? []).map((phone) =>
            ProfileMapper.mapPhoneNumberToDto(phone),
        );
    }

    async setPrimaryPhoneNumber(
        profileId: string,
        userId: string,
        phoneNumberId: string,
        isPrimary: boolean,
    ): Promise<ProfilePhoneNumberResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        let found = false;
        for (const phoneNumber of profile.phoneNumbers || []) {
            if (phoneNumber.id === phoneNumberId) {
                phoneNumber.isPrimary = isPrimary;
                found = true;
            } else if (isPrimary) {
                phoneNumber.isPrimary = false;
            }
        }
        if (!found) {
            throw new NotFoundException(`Phone number with id ${phoneNumberId} not found`);
        }
        const saved = await this.repo.save(profile);
        return (saved.phoneNumbers ?? []).map((phone) => ProfileMapper.mapPhoneNumberToDto(phone));
    }

    // ----------------------
    // Addresses
    // ----------------------
    async createAddresses(
        profileId: string,
        userId: string,
        dto: CreateProfileAddressDto,
    ): Promise<ProfileAddressResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        const newAddresses = dto.items.map((item) => ProfileMapper.mapAddressDtoToEntity(item));
        profile.addresses = [...(profile.addresses || []), ...newAddresses];
        this.validatePrimaryFlags(profile);
        const saved = await this.repo.save(profile);
        return (saved.addresses ?? []).map((address) => ProfileMapper.mapAddressToDto(address));
    }

    async updateAddresses(
        profileId: string,
        userId: string,
        dto: UpdateProfileAddressDto,
    ): Promise<ProfileAddressResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.addresses || !profile.addresses.length || !dto.items || !dto.items.length) {
            throw new NotFoundException('No addresses found for this profile');
        }

        const addressMap = new Map(profile.addresses.map((address) => [address.id, address]));

        for (const addressDto of dto.items) {
            if (!addressDto.id) {
                throw new BadRequestException('Address ID is required for update');
            }

            const existingAddress = addressMap.get(addressDto.id);
            if (!existingAddress) {
                throw new NotFoundException(`Address with id ${addressDto.id} not found`);
            }

            const updatedData = ProfileMapper.mapAddressDtoToEntity(addressDto);
            Object.assign(existingAddress, updatedData);
        }

        this.validatePrimaryFlags(profile);

        const savedProfile = await this.repo.save(profile);
        return (savedProfile.addresses ?? []).map((address) =>
            ProfileMapper.mapAddressToDto(address),
        );
    }

    async removeAddresses(
        profileId: string,
        userId: string,
        dto: BulkDeleteDto,
    ): Promise<ProfileAddressResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.addresses || profile.addresses.length === 0) {
            throw new NotFoundException('No addresses found for this profile');
        }

        const idsToDelete = new Set(dto.ids);
        const addressesToDelete = profile.addresses.filter((address) =>
            idsToDelete.has(address.id),
        );

        if (addressesToDelete.length === 0) {
            throw new NotFoundException('None of the specified addresses found');
        }

        await this.addressRepo.remove(addressesToDelete);

        const updatedProfile = await this.repo.findOneById(profileId);
        if (!updatedProfile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }

        return (updatedProfile.addresses ?? []).map((address) =>
            ProfileMapper.mapAddressToDto(address),
        );
    }

    async setPrimaryAddress(
        profileId: string,
        userId: string,
        addressId: string,
        isPrimary: boolean,
    ): Promise<ProfileAddressResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        let found = false;
        for (const address of profile.addresses || []) {
            if (address.id === addressId) {
                address.isPrimary = isPrimary;
                found = true;
            } else if (isPrimary) {
                address.isPrimary = false;
            }
        }
        if (!found) throw new NotFoundException(`Address with id ${addressId} not found`);
        const saved = await this.repo.save(profile);
        return (saved.addresses ?? []).map((address) => ProfileMapper.mapAddressToDto(address));
    }

    // ----------------------
    // Links
    // ----------------------
    async createLinks(
        profileId: string,
        userId: string,
        dto: CreateProfileLinkDto,
    ): Promise<ProfileLinkResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);
        const newLinks = dto.items.map((item) => ProfileMapper.mapLinkDtoToEntity(item));
        profile.links = [...(profile.links || []), ...newLinks];
        const saved = await this.repo.save(profile);
        return (saved.links ?? []).map((link) => ProfileMapper.mapLinkToDto(link));
    }

    async updateLinks(
        profileId: string,
        userId: string,
        dto: UpdateProfileLinkDto,
    ): Promise<ProfileLinkResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.links || !profile.links.length || !dto.items || !dto.items.length) {
            throw new NotFoundException('No addresses found for this profile');
        }

        const linkMap = new Map(profile.links.map((link) => [link.id, link]));

        for (const linkDto of dto.items) {
            if (!linkDto.id) {
                throw new BadRequestException('Link ID is required for update');
            }

            const existingLink = linkMap.get(linkDto.id);
            if (!existingLink) {
                throw new NotFoundException(`Link with id ${linkDto.id} not found`);
            }

            // Use mapper to convert DTO and apply to existing entity
            const updatedData = ProfileMapper.mapLinkDtoToEntity(linkDto);
            Object.assign(existingLink, updatedData);
        }

        const savedProfile = await this.repo.save(profile);
        return (savedProfile.links ?? []).map((link) => ProfileMapper.mapLinkToDto(link));
    }

    async removeLinks(
        profileId: string,
        userId: string,
        dto: BulkDeleteDto,
    ): Promise<ProfileLinkResponseDto[]> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.links || profile.links.length === 0) {
            throw new NotFoundException('No links found for this profile');
        }

        const idsToDelete = new Set(dto.ids);
        const linksToDelete = profile.links.filter((link) => idsToDelete.has(link.id));

        if (linksToDelete.length === 0) {
            throw new NotFoundException('None of the specified links found');
        }

        await this.linkRepo.remove(linksToDelete);

        const updatedProfile = await this.repo.findOneById(profileId);
        if (!updatedProfile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }

        return (updatedProfile.links ?? []).map((link) => ProfileMapper.mapLinkToDto(link));
    }

    // ----------------------
    // Profile Image / Cover Upload
    // ----------------------
    async uploadProfileImage(
        profileId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<UploadUserFileResponseDto> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        this.logger.log(`Uploading profile image for user: ${userId}`);
        const uploadResult = await this.userFileService.uploadProfileImage(userId, file);
        profile.profileImageUrl = uploadResult.fileUrl;
        await this.repo.save(profile);
        return uploadResult;
    }

    async uploadCoverImage(
        profileId: string,
        userId: string,
        file: Express.Multer.File,
    ): Promise<UploadUserFileResponseDto> {
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        this.logger.log(`Uploading cover image for user: ${userId}`);
        const uploadResult = await this.userFileService.uploadCoverImage(userId, file);
        profile.coverImageUrl = uploadResult.fileUrl;
        await this.repo.save(profile);
        return uploadResult;
    }

    // ----------------------
    // vCard Management
    // ----------------------
    async updateVCardPrivacySettings(
        profileId: string,
        userId: string,
        dto: UpdateVCardPrivacyDto,
    ): Promise<ProfileResponseDto> {
        this.logger.log(`Updating vCard privacy settings for profile: ${profileId}`);
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        const currentSettings = (profile.vcardPrivacySettings as VCardPrivacySettings) ?? {};
        const include_photo = dto.include_photo ?? currentSettings.include_photo ?? true;
        const include_social = dto.include_social ?? currentSettings.include_social ?? true;
        const include_address = dto.include_address ?? currentSettings.include_address ?? true;
        profile.vcardPrivacySettings = {
            include_photo,
            include_social,
            include_address,
        } as VCardPrivacySettings;

        profile.vcardLastGenerated = null;

        const saved = await this.repo.save(profile);
        this.logger.log(`vCard privacy settings updated for profile: ${profileId}`);

        return ProfileMapper.mapToDto(saved);
    }

    async generateVCard(
        profileId: string,
        userId: string,
    ): Promise<{ vcard: string; qrCode: string | null }> {
        this.logger.log(`Generating vCard for profile: ${profileId}`);
        const profile = await this.getOwnedProfileOrThrow(profileId, userId);

        if (!profile.vcardEnabled) {
            throw new BadRequestException('vCard generation is disabled for this profile');
        }

        const privacySettings = profile.vcardPrivacySettings
            ? (profile.vcardPrivacySettings as {
                  include_photo?: boolean;
                  include_social?: boolean;
                  include_address?: boolean;
              })
            : null;
        const vcardContent = this.vcardService.generateVCard(profile, privacySettings);

        const qrCode = await this.vcardService.generateVCardQrDataUri(vcardContent);

        profile.vcardLastGenerated = new Date();
        await this.repo.save(profile);

        this.logger.log(`vCard generated successfully for profile: ${profileId}`);

        return {
            vcard: vcardContent,
            qrCode,
        };
    }

    async getVCard(profileId: string): Promise<string> {
        this.logger.log(`Getting vCard for profile: ${profileId}`);
        const profile = await this.repo.findOneById(profileId);

        if (!profile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }

        if (!profile.vcardEnabled) {
            throw new BadRequestException('vCard is disabled for this profile');
        }

        if (!profile.isPublic) {
            throw new ForbiddenException('Profile is not public');
        }

        const privacySettings = profile.vcardPrivacySettings
            ? (profile.vcardPrivacySettings as {
                  include_photo?: boolean;
                  include_social?: boolean;
                  include_address?: boolean;
              })
            : null;

        return this.vcardService.generateVCard(profile, privacySettings);
    }

    /**
     * Get vCard content for a profile by its public handle.
     * Ensures vCard generation is enabled and the profile is public.
     */
    async getVCardByHandle(handle: string): Promise<string> {
        this.logger.log(`Getting vCard for profile handle: ${handle}`);
        const profile = await this.repo.findOneByProfileHandle(handle);

        if (!profile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }

        if (!profile.vcardEnabled) {
            throw new BadRequestException('vCard is disabled for this profile');
        }

        if (!profile.isPublic) {
            throw new ForbiddenException('Profile is not public');
        }

        const privacySettings = profile.vcardPrivacySettings
            ? (profile.vcardPrivacySettings as {
                  include_photo?: boolean;
                  include_social?: boolean;
                  include_address?: boolean;
              })
            : null;

        return this.vcardService.generateVCard(profile, privacySettings);
    }

    // ----------------------
    // Validation helpers
    // ----------------------
    private validatePrimaryFlags(profile: Partial<Profile>): void {
        const collections = [
            { items: profile.phoneNumbers, name: 'phone number' },
            { items: profile.emails, name: 'email' },
            { items: profile.addresses, name: 'address' },
        ];

        for (const { items, name } of collections) {
            if (!items?.length) continue;
            const primaryCount = items.filter((item) => item.isPrimary).length;
            if (primaryCount > 1) {
                throw new BadRequestException(`Only one ${name} can be marked as primary`);
            }
        }
    }

    private async validateUniqueFields(profile: Partial<Profile>, excludeId?: string) {
        if (profile.profileHandle) {
            // Check if handle is reserved
            const normalizedHandle = profile.profileHandle.toLowerCase();
            if ((RESERVED_PROFILE_HANDLES as readonly string[]).includes(normalizedHandle)) {
                throw new BadRequestException(
                    `Profile handle '${profile.profileHandle}' is reserved and cannot be used`,
                );
            }

            const existing = await this.repo.findOneByProfileHandle(profile.profileHandle);
            if (existing && existing.id !== excludeId) {
                throw new BadRequestException(
                    `Profile handle '${profile.profileHandle}' is already taken`,
                );
            }
        }

        if (profile.deeplinkSlug) {
            // Check if slug is reserved
            const normalizedSlug = profile.deeplinkSlug.toLowerCase();
            if ((RESERVED_PROFILE_HANDLES as readonly string[]).includes(normalizedSlug)) {
                throw new BadRequestException(
                    `Deeplink slug '${profile.deeplinkSlug}' is reserved and cannot be used`,
                );
            }

            const existing = await this.repo.findOneByDeeplinkSlug(profile.deeplinkSlug);
            if (existing && existing.id !== excludeId) {
                throw new BadRequestException(
                    `Deeplink slug '${profile.deeplinkSlug}' is already taken`,
                );
            }
        }
    }

    /**
     * Generic method to generate a unique identifier (handle or slug) from a name.
     * Uses stateless ProfileUtil for transformation and handles DB uniqueness checking.
     *
     * @param name - The base name to generate the identifier from
     * @param checkUniqueness - Async function to check if the identifier exists in DB
     * @param fieldName - Human-readable field name for error messages
     * @returns A unique identifier string
     */
    private async generateUniqueIdentifier(
        name: string,
        checkUniqueness: (value: string) => Promise<Profile | null>,
        fieldName: string,
    ): Promise<string> {
        const baseIdentifier = ProfileUtil.generateBaseHandle(name);

        // Check if base identifier is reserved
        if ((RESERVED_PROFILE_HANDLES as readonly string[]).includes(baseIdentifier)) {
            this.logger.warn(
                `Attempted to use reserved ${fieldName}: ${baseIdentifier}. Adding suffix.`,
            );
            // Force adding a suffix for reserved handles
            const identifier = ProfileUtil.generateHandleWithSuffix(baseIdentifier);
            const existing = await checkUniqueness(identifier);
            if (!existing) {
                return identifier;
            }
        }

        let identifier = baseIdentifier;
        let existing = await checkUniqueness(identifier);

        // If collision, add random suffix until unique
        const MAX_ATTEMPTS = 10;
        let attempts = 0;

        while (existing && attempts < MAX_ATTEMPTS) {
            identifier = ProfileUtil.generateHandleWithSuffix(baseIdentifier);
            existing = await checkUniqueness(identifier);
            attempts++;
        }

        if (existing) {
            throw new BadRequestException(
                `Unable to generate unique ${fieldName}. Please try again.`,
            );
        }

        return identifier;
    }

    /**
     * Generates a unique profile handle from the name
     */
    private async generateUniqueProfileHandle(name: string): Promise<string> {
        return this.generateUniqueIdentifier(
            name,
            (handle) => this.repo.findOneByProfileHandle(handle),
            'profile handle',
        );
    }

    /**
     * Generate a unique deeplink slug using the same logic as profile handle
     */
    private async generateUniqueDeeplinkSlug(name: string): Promise<string> {
        return this.generateUniqueIdentifier(
            name,
            (slug) => this.repo.findOneByDeeplinkSlug(slug),
            'deeplink slug',
        );
    }

    /**
     * Build canonical QR code URL for a profile handle.
     * Uses configured frontend URL and builds path /profiles/{handle}.
     * This should match the frontend route for displaying profile pages.
     */
    private generateQrCodeUrl(handle: string): string {
        const base = this.appConfig.frontendUrl;
        // Use the frontend profile route (/profiles/:handle) which exists in the frontend.
        return `${base}/profiles/${encodeURIComponent(handle)}`;
    }

    /**
     * Build vCard QR code URL for a profile handle.
     * Points to the vCard download endpoint.
     */
    private generateVCardQrCodeUrl(handle: string): string {
        // Prefer using the backend API URL so scanning the vCard QR opens the raw vCard download endpoint directly.
        const base = this.appConfig.apiUrl || this.appConfig.frontendUrl;
        return `${base}/profiles/handle/${encodeURIComponent(handle)}/vcard`;
    }

    /**
     * Initialize vCard settings with default values for a new profile.
     * Sets vCard QR code URL, enabled flag, version, and privacy settings.
     */
    private initializeVCardSettings(profile: Partial<Profile>): void {
        if (!profile.profileHandle) {
            return;
        }

        // Generate vCard QR code URL (points to vCard download endpoint)
        profile.vcardQrCodeUrl = this.generateVCardQrCodeUrl(profile.profileHandle);

        // Set default vCard enabled flag
        if (!profile.vcardEnabled) {
            profile.vcardEnabled = true;
        }

        // Set default vCard version
        if (!profile.vcardVersion) {
            profile.vcardVersion = '4.0';
        }

        // Set default vCard privacy settings (all fields visible by default)
        if (!profile.vcardPrivacySettings) {
            profile.vcardPrivacySettings = {
                include_photo: true,
                include_social: true,
                include_address: true,
            };
        }
    }

    /**
     * Generate QR code PNG buffer for a given URL.
     * Used by controller endpoints to serve QR images directly.
     */
    async generateQrCodeBuffer(url: string): Promise<Buffer> {
        try {
            return await QRCode.toBuffer(url, {
                type: 'png',
                width: 512,
                margin: 2,
            });
        } catch (e) {
            this.logger.error(`Failed to generate QR code buffer: ${(e as Error).message}`);
            throw new BadRequestException('Failed to generate QR code');
        }
    }

    /**
     * Generate profile QR code image for a given handle.
     * Returns the PNG buffer that can be served directly.
     * Uses configured frontendUrl for building the profile URL.
     */
    async generateProfileQrCode(handle: string): Promise<Buffer> {
        const profile = await this.repo.findOneByProfileHandle(handle);
        if (!profile) throw new NotFoundException(PROFILE_NOT_FOUND);

        const profileUrl = this.generateQrCodeUrl(handle);
        return this.generateQrCodeBuffer(profileUrl);
    }

    /**
     * Generate vCard QR code image for a given handle.
     * Returns the PNG buffer that can be served directly.
     * Uses configured frontendUrl for building the vCard URL.
     */
    async generateVCardQrCode(handle: string): Promise<Buffer> {
        const profile = await this.repo.findOneByProfileHandle(handle);
        if (!profile) {
            throw new NotFoundException(PROFILE_NOT_FOUND);
        }
        const vcardUrl = this.generateVCardQrCodeUrl(handle);
        return this.generateQrCodeBuffer(vcardUrl);
    }
}
