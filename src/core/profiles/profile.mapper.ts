import { ProfileResponseDto } from './dto/profile-response.dto';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfilePhoneNumber } from './entities/profile-phone-number.entity';
import { ProfileEmail } from './entities/profile-email.entity';
import { ProfileAddress } from './entities/profile-address.entity';
import { ProfileLink } from './entities/profile-link.entity';
import { ProfilePhoneNumberDto } from './dto/profile-phone-number.dto';
import { ProfileEmailDto } from './dto/profile-email.dto';
import { ProfileAddressDto } from './dto/profile-address.dto';
import { ProfileLinkDto } from './dto/profile-link.dto';
import { ProfilePhoneNumberResponseDto } from './dto/profile-phone-number-response.dto';
import { ProfileEmailResponseDto } from './dto/profile-email-response.dto';
import { ProfileAddressResponseDto } from './dto/profile-address-response.dto';
import { ProfileLinkResponseDto } from './dto/profile-link-response.dto';
import { LINK_TYPE } from './types';
import { mapArray } from '../../common/utils/generic.util';

export class ProfileMapper {
    /* ---------------------------------------------------------------------
     * ENTITY → RESPONSE DTO
     * -------------------------------------------------------------------*/
    static mapToDto(entity: Profile, baseURL?: string): ProfileResponseDto {
        let profileQrCodeUrl = entity.profileQrCodeUrl;
        let vcardQrCodeUrl = entity.vcardQrCodeUrl;

        if (baseURL && entity.profileHandle) {
            profileQrCodeUrl = `${baseURL}/profiles/${encodeURIComponent(entity.profileHandle)}/page-qr.png`;
            vcardQrCodeUrl = `${baseURL}/profiles/${encodeURIComponent(entity.profileHandle)}/vcard-qr.png`;
        }

        return {
            id: entity.id,
            user_id: entity.userId,
            name: entity.name,
            title: entity.title,
            department: entity.department,
            company_name: entity.companyName,
            about_me: entity.aboutMe,
            profile_tags: entity.profileTags,
            profile_handle: entity.profileHandle,
            deeplink_slug: entity.deeplinkSlug,
            profile_image_url: entity.profileImageUrl,
            cover_image_url: entity.coverImageUrl,
            profile_qr_code_url: profileQrCodeUrl,
            vcard_qr_code_url: vcardQrCodeUrl,
            vcard_enabled: entity.vcardEnabled,
            vcard_version: entity.vcardVersion,
            vcard_last_generated: entity.vcardLastGenerated,
            vcard_privacy_settings: entity.vcardPrivacySettings,
            is_public: entity.isPublic,
            contact_capture_enabled: entity.contactCaptureEnabled,
            phone_numbers: mapArray(entity.phoneNumbers, (phone) =>
                ProfileMapper.mapPhoneNumberToDto(phone),
            ),
            emails: mapArray(entity.emails, (email) => ProfileMapper.mapEmailToDto(email)),
            addresses: mapArray(entity.addresses, (address) =>
                ProfileMapper.mapAddressToDto(address),
            ),
            links: mapArray(entity.links, (link) => ProfileMapper.mapLinkToDto(link)),
            created_at: entity.createdAt,
            updated_at: entity.updatedAt,
        };
    }

    /* ---------------------------------------------------------------------
     * DTO → ENTITY (partial update)
     * -------------------------------------------------------------------*/
    static mapToEntity(dto: CreateProfileDto | UpdateProfileDto): Partial<Profile> {
        const entity: Partial<Profile> = {};

        // Scalars
        if (dto.user_id !== undefined) {
            entity.userId = dto.user_id;
        }
        if (dto.name !== undefined) {
            entity.name = dto.name;
        }
        if (dto.title !== undefined) {
            entity.title = dto.title ?? null;
        }
        if (dto.department !== undefined) {
            entity.department = dto.department ?? null;
        }
        if (dto.company_name !== undefined) {
            entity.companyName = dto.company_name ?? null;
        }
        if (dto.about_me !== undefined) {
            entity.aboutMe = dto.about_me ?? null;
        }
        if (dto.profile_tags !== undefined) {
            entity.profileTags = dto.profile_tags ?? null;
        }
        if (dto.vcard_enabled !== undefined) {
            entity.vcardEnabled = dto.vcard_enabled ?? false;
        }
        if (dto.vcard_version !== undefined) {
            entity.vcardVersion = dto.vcard_version ?? null;
        }
        if (dto.vcard_privacy_settings !== undefined) {
            entity.vcardPrivacySettings = dto.vcard_privacy_settings ?? null;
        }
        if (dto.is_public !== undefined) {
            entity.isPublic = dto.is_public ?? null;
        }
        if (dto.contact_capture_enabled !== undefined) {
            entity.contactCaptureEnabled = dto.contact_capture_enabled ?? null;
        }

        // Arrays
        if (dto.phone_numbers !== undefined) {
            entity.phoneNumbers = Array.isArray(dto.phone_numbers)
                ? dto.phone_numbers.map((item) => this.mapPhoneNumberDtoToEntity(item))
                : null;
        }
        if (dto.emails !== undefined) {
            entity.emails = Array.isArray(dto.emails)
                ? dto.emails.map((item) => this.mapEmailDtoToEntity(item))
                : null;
        }
        if (dto.addresses !== undefined) {
            entity.addresses = Array.isArray(dto.addresses)
                ? dto.addresses.map((item) => this.mapAddressDtoToEntity(item))
                : null;
        }
        if (dto.links !== undefined) {
            entity.links = Array.isArray(dto.links)
                ? dto.links.map((item) => this.mapLinkDtoToEntity(item))
                : null;
        }

        return entity;
    }

    /* ---------------------------------------------------------------------
     * ENTITY → RESPONSE DTO helpers
     * -------------------------------------------------------------------*/
    static mapPhoneNumberToDto(phone: ProfilePhoneNumber): ProfilePhoneNumberResponseDto {
        return {
            id: phone.id,
            profile_id: phone.profileId,
            number_type: phone.numberType,
            raw_number: phone.rawNumber,
            country_code: phone.countryCode,
            area_code: phone.areaCode,
            local_number: phone.localNumber,
            extension: phone.extension,
            is_primary: phone.isPrimary,
            created_at: phone.createdAt,
            updated_at: phone.updatedAt,
        };
    }

    static mapEmailToDto(email: ProfileEmail): ProfileEmailResponseDto {
        return {
            id: email.id,
            profile_id: email.profileId,
            email: email.email,
            email_type: email.emailType,
            is_primary: email.isPrimary,
            created_at: email.createdAt,
            updated_at: email.updatedAt,
        };
    }

    static mapAddressToDto(address: ProfileAddress): ProfileAddressResponseDto {
        return {
            id: address.id,
            profile_id: address.profileId,
            raw_address: address.rawAddress,
            street_number: address.streetNumber,
            street_name: address.streetName,
            unit_suite: address.unitSuite,
            city: address.city,
            state_province: address.stateProvince,
            postal_code: address.postalCode,
            country: address.country,
            address_type: address.addressType,
            is_primary: address.isPrimary,
            created_at: address.createdAt,
            updated_at: address.updatedAt,
        };
    }

    static mapLinkToDto(link: ProfileLink): ProfileLinkResponseDto {
        return {
            id: link.id,
            profile_id: link.profileId,
            link_type: link.linkType,
            platform: link.platform,
            url: link.url,
            display_name: link.displayName,
            sort_order: link.sortOrder,
            created_at: link.createdAt,
            updated_at: link.updatedAt,
        };
    }

    /* ---------------------------------------------------------------------
     * DTO → ENTITY helpers (preserve ID)
     * -------------------------------------------------------------------*/
    static mapPhoneNumberDtoToEntity(dto: ProfilePhoneNumberDto): ProfilePhoneNumber {
        const entity = new ProfilePhoneNumber();
        if (dto.id !== undefined) {
            entity.id = dto.id;
        }
        entity.numberType = dto.number_type;
        entity.rawNumber = dto.raw_number;
        entity.countryCode = dto.country_code ?? null;
        entity.areaCode = dto.area_code ?? null;
        entity.localNumber = dto.local_number ?? null;
        entity.extension = dto.extension ?? null;
        entity.isPrimary = dto.is_primary ?? false;
        return entity;
    }

    static mapEmailDtoToEntity(dto: ProfileEmailDto): ProfileEmail {
        const entity = new ProfileEmail();
        if (dto.id !== undefined) {
            entity.id = dto.id;
        }
        entity.email = dto.email;
        entity.emailType = dto.email_type ?? 'work';
        entity.isPrimary = dto.is_primary ?? false;
        return entity;
    }

    static mapAddressDtoToEntity(dto: ProfileAddressDto): ProfileAddress {
        const entity = new ProfileAddress();
        if (dto.id !== undefined) {
            entity.id = dto.id;
        }
        entity.rawAddress = dto.raw_address;
        entity.streetNumber = dto.street_number ?? null;
        entity.streetName = dto.street_name ?? null;
        entity.unitSuite = dto.unit_suite ?? null;
        entity.city = dto.city ?? null;
        entity.stateProvince = dto.state_province ?? null;
        entity.postalCode = dto.postal_code ?? null;
        entity.country = dto.country ?? null;
        entity.addressType = dto.address_type;
        entity.isPrimary = dto.is_primary ?? false;
        return entity;
    }

    static mapLinkDtoToEntity(dto: ProfileLinkDto): ProfileLink {
        const entity = new ProfileLink();
        if (dto.id !== undefined) {
            entity.id = dto.id;
        }
        entity.linkType = dto.link_type ?? LINK_TYPE.SOCIAL;
        entity.platform = dto.platform;
        entity.url = dto.url;
        entity.displayName = dto.display_name ?? null;
        entity.sortOrder = dto.sort_order ?? 0;
        return entity;
    }
}
