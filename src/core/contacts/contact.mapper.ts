import { Contact } from './entities/contact.entity';
import {
    CreateContactDto,
    ContactPhoneNumberDto,
    ContactEmailDto,
    ContactAddressDto,
    ContactLinkDto,
} from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactPhoneNumber } from './entities/contact-phone-number.entity';
import { ContactEmail } from './entities/contact-email.entity';
import { ContactAddress } from './entities/contact-address.entity';
import { ContactLink } from './entities/contact-link.entity';
import { ContactResponseDto } from './dto/contact-response.dto';
import { ContactPhoneNumberResponseDto } from './dto/contact-phone-number-response.dto';
import { ContactEmailResponseDto } from './dto/contact-email-response.dto';
import { ContactAddressResponseDto } from './dto/contact-address-response.dto';
import { ContactLinkResponseDto } from './dto/contact-link-response.dto';
import {
    PhoneNumberType,
    EmailType,
    AddressType,
    LinkType,
    ContactType,
    AcquiredVia,
    ScannedType,
} from './enums';

export class ContactMapper {
    static mapToDto(entity: Contact): ContactResponseDto {
        return {
            id: entity.id,
            owner_id: entity.ownerId,
            contact_type: entity.contactType as ContactType,
            linked_user_id: entity.linkedUserId ?? null,
            name: entity.name ?? null,
            title: entity.title ?? null,
            department: entity.department ?? null,
            company_name: entity.companyName ?? null,
            about_me: entity.aboutMe ?? null,
            profile_image_url: entity.profileImageUrl ?? null,
            acquired_via: entity.acquiredVia as AcquiredVia,
            scanned_type: (entity.scannedType as ScannedType) ?? null,
            acquired_at: entity.acquiredAt ?? null,
            event_id: entity.eventId ?? null,
            lounge_session_id: entity.loungeSessionId ?? null,
            contact_submission_id: entity.contactSubmissionId ?? null,
            meeting_notes: entity.meetingNotes ?? null,
            is_favorite: entity.isFavorite ?? false,
            is_pinned: entity.isPinned ?? false,
            automatic_tags: entity.automaticTags ?? null,
            user_tags: entity.userTags ?? null,
            contact_hash: entity.contactHash ?? null,
            created_at: entity.createdAt ?? null,
            updated_at: entity.updatedAt ?? null,
            phone_numbers: (entity.phoneNumbers ?? []).map((p) => this.mapPhoneNumberToDto(p)),
            emails: (entity.emails ?? []).map((e) => this.mapEmailToDto(e)),
            addresses: (entity.addresses ?? []).map((a) => this.mapAddressToDto(a)),
            links: (entity.links ?? []).map((l) => this.mapLinkToDto(l)),
            files: (entity.files ?? []).map((f) => ({
                id: f.id,
                file_id: f.fileId,
            })),
        };
    }

    static mapToEntity(dto: CreateContactDto | UpdateContactDto): Partial<Contact> {
        const entity: Partial<Contact> = {};

        // Scalars
        if (dto.user_id !== undefined) {
            entity.ownerId = dto.user_id;
        }
        if (dto.contact_type !== undefined) {
            entity.contactType = dto.contact_type ?? 'external';
        }
        if (dto.linked_user_id !== undefined) {
            entity.linkedUserId = dto.linked_user_id ?? null;
        }
        if (dto.name !== undefined) {
            entity.name = dto.name ?? null;
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
        if (dto.profile_image_url !== undefined) {
            entity.profileImageUrl = dto.profile_image_url ?? null;
        }
        if (dto.acquired_via !== undefined) {
            entity.acquiredVia = dto.acquired_via ?? 'manual';
        }
        if (dto.scanned_type !== undefined) {
            entity.scannedType = dto.scanned_type ?? null;
        }
        if (dto.acquired_at !== undefined) {
            entity.acquiredAt = dto.acquired_at ? new Date(dto.acquired_at) : null;
        }
        if (dto.event_id !== undefined) {
            entity.eventId = dto.event_id ?? null;
        }
        if (dto.lounge_session_id !== undefined) {
            entity.loungeSessionId = dto.lounge_session_id ?? null;
        }
        if (dto.contact_submission_id !== undefined) {
            entity.contactSubmissionId = dto.contact_submission_id ?? null;
        }
        if (dto.meeting_notes !== undefined) {
            entity.meetingNotes = dto.meeting_notes ?? null;
        }
        if (dto.is_favorite !== undefined) {
            entity.isFavorite = dto.is_favorite ?? false;
        }
        if (dto.is_pinned !== undefined) {
            entity.isPinned = dto.is_pinned ?? false;
        }
        if (dto.automatic_tags !== undefined) {
            entity.automaticTags = dto.automatic_tags ?? null;
        }
        if (dto.user_tags !== undefined) {
            entity.userTags = dto.user_tags ?? null;
        }
        if (dto.contact_hash !== undefined) {
            entity.contactHash = dto.contact_hash ?? null;
        }

        // Arrays
        if (dto.phone_numbers !== undefined) {
            entity.phoneNumbers = Array.isArray(dto.phone_numbers)
                ? dto.phone_numbers.map((i) => this.mapPhoneNumberDtoToEntity(i))
                : undefined;
        }
        if (dto.emails !== undefined) {
            entity.emails = Array.isArray(dto.emails)
                ? dto.emails.map((i) => this.mapEmailDtoToEntity(i))
                : undefined;
        }
        if (dto.addresses !== undefined) {
            entity.addresses = Array.isArray(dto.addresses)
                ? dto.addresses.map((i) => this.mapAddressDtoToEntity(i))
                : undefined;
        }
        if (dto.links !== undefined) {
            entity.links = Array.isArray(dto.links)
                ? dto.links.map((i) => this.mapLinkDtoToEntity(i))
                : undefined;
        }

        return entity;
    }

    static mapPhoneNumberToDto(p: ContactPhoneNumber): ContactPhoneNumberResponseDto {
        return {
            id: p.id,
            contact_id: p.contact?.id ?? null,
            number_type: p.numberType as PhoneNumberType,
            raw_number: p.rawNumber,
            country_code: p.countryCode ?? null,
            area_code: p.areaCode ?? null,
            local_number: p.localNumber ?? null,
            extension: p.extension ?? null,
            is_primary: p.isPrimary ?? false,
            created_at: p.createdAt ?? null,
            updated_at: p.updatedAt ?? null,
        };
    }

    static mapEmailToDto(e: ContactEmail): ContactEmailResponseDto {
        return {
            id: e.id,
            contact_id: e.contact?.id ?? null,
            email: e.email,
            email_type: (e.emailType as EmailType) ?? null,
            is_primary: e.isPrimary ?? false,
            created_at: e.createdAt ?? null,
            updated_at: e.updatedAt ?? null,
        };
    }

    static mapAddressToDto(a: ContactAddress): ContactAddressResponseDto {
        return {
            id: a.id,
            contact_id: a.contact?.id ?? null,
            raw_address: a.rawAddress,
            street_number: a.streetNumber ?? null,
            street_name: a.streetName ?? null,
            unit_suite: a.unitSuite ?? null,
            city: a.city ?? null,
            state_province: a.stateProvince ?? null,
            postal_code: a.postalCode ?? null,
            country: a.country ?? null,
            address_type: (a.addressType as AddressType) ?? null,
            is_primary: a.isPrimary ?? false,
            created_at: a.createdAt ?? null,
            updated_at: a.updatedAt ?? null,
        };
    }

    static mapLinkToDto(l: ContactLink): ContactLinkResponseDto {
        return {
            id: l.id,
            contact_id: l.contact?.id ?? null,
            link_type: (l.linkType as LinkType) ?? null,
            platform: l.platform,
            url: l.url,
            display_name: l.displayName ?? null,
            sort_order: l.sortOrder ?? null,
            created_at: l.createdAt ?? null,
            updated_at: l.updatedAt ?? null,
        };
    }

    static mapPhoneNumberDtoToEntity(dto: ContactPhoneNumberDto): ContactPhoneNumber {
        const e = new ContactPhoneNumber();
        if (dto.id !== undefined) e.id = dto.id;
        e.numberType = dto.number_type;
        e.rawNumber = dto.raw_number;
        e.countryCode = dto.country_code ?? null;
        e.areaCode = dto.area_code ?? null;
        e.localNumber = dto.local_number ?? null;
        e.extension = dto.extension ?? null;
        e.isPrimary = dto.is_primary ?? false;
        return e;
    }

    static mapEmailDtoToEntity(dto: ContactEmailDto): ContactEmail {
        const e = new ContactEmail();
        if (dto.id !== undefined) e.id = dto.id;
        e.email = dto.email;
        e.emailType = dto.email_type ?? 'work';
        e.isPrimary = dto.is_primary ?? false;
        return e;
    }

    static mapAddressDtoToEntity(dto: ContactAddressDto): ContactAddress {
        const e = new ContactAddress();
        if (dto.id !== undefined) e.id = dto.id;
        e.rawAddress = dto.raw_address;
        e.streetNumber = dto.street_number ?? null;
        e.streetName = dto.street_name ?? null;
        e.unitSuite = dto.unit_suite ?? null;
        e.city = dto.city ?? null;
        e.stateProvince = dto.state_province ?? null;
        e.postalCode = dto.postal_code ?? null;
        e.country = dto.country ?? null;
        e.addressType = dto.address_type ?? 'business';
        e.isPrimary = dto.is_primary ?? false;
        return e;
    }

    static mapLinkDtoToEntity(dto: ContactLinkDto): ContactLink {
        const e = new ContactLink();
        if (dto.id !== undefined) e.id = dto.id;
        e.linkType = dto.link_type ?? 'social';
        e.platform = dto.platform;
        e.url = dto.url;
        e.displayName = dto.display_name ?? null;
        e.sortOrder = dto.sort_order ?? 0;
        return e;
    }
}
