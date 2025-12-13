import {
    BadRequestException,
    Injectable,
    NotFoundException,
    Logger,
    Inject,
    forwardRef,
} from '@nestjs/common';
import { ContactRepository } from './contact.repository';
import { ContactFileRepository } from './contact-file.repository';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { CreateScannedContactDto } from './dto/create-scanned-contact.dto';
import { UploadBusinessCardDto, BusinessCardResponseDto } from './dto/business-card.dto';
import { ContactResponseDto } from './dto/contact-response.dto';
import { DuplicateContactResponseDto } from './dto/duplicate-contact-response.dto';
import { EventContactsResponseDto } from './dto/event-contacts-response.dto';
import { OcrCacheResultDto } from './dto/ocr-cache-result.dto';
import { ContactMapper } from './contact.mapper';
import { CreateContactPhoneNumbersDto } from './dto/create-contact-phone-numbers.dto';
import { CreateContactEmailsDto } from './dto/create-contact-emails.dto';
import { CreateContactAddressesDto } from './dto/create-contact-addresses.dto';
import { CreateContactLinksDto } from './dto/create-contact-links.dto';
import { ContactPhoneNumberResponseDto } from './dto/contact-phone-number-response.dto';
import { ContactEmailResponseDto } from './dto/contact-email-response.dto';
import { ContactAddressResponseDto } from './dto/contact-address-response.dto';
import { ContactLinkResponseDto } from './dto/contact-link-response.dto';
import { ContactHashUtil } from './utils/contact-hash.util';
import { UserFileService } from '../users/user-file.service';
import { UserFileRepository } from '../users/user-file.repository';
import { UsersService } from '../users/users.service';
import { ContactSubmissionRepository } from '../contact-forms/contact-submission.repository';
import { AppConfig } from '../../common/config/app.config';
import type { IOcrService } from '../../common/ocr';
import { OCR_SERVICE } from '../../common/ocr';
import { computeFileHash } from '../../common/utils/hash.util';
import type { PhoneContactData } from './types/phone-contact-data.interface';
import {
    OCR_ENGINE,
    PROCESSING_STATUS,
    DOCUMENT_TYPE,
    CARD_SIDE,
    ACQUIRED_VIA,
    SCANNED_TYPE,
    AUTO_TAG,
    VALIDATION_LIMITS,
    ERROR_MESSAGES,
    LOG_MESSAGES,
} from './contacts.constants';

@Injectable()
export class ContactsService {
    private readonly logger = new Logger(ContactsService.name);

    constructor(
        private readonly repo: ContactRepository,
        private readonly contactFileRepo: ContactFileRepository,
        @Inject(forwardRef(() => UserFileService))
        private readonly userFileService: UserFileService,
        private readonly userFileRepo: UserFileRepository,
        private readonly appConfig: AppConfig,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        @Inject(forwardRef(() => ContactSubmissionRepository))
        private readonly contactSubmissionRepo: ContactSubmissionRepository,
        @Inject(OCR_SERVICE) private readonly ocrService?: IOcrService,
    ) {}

    // US-C5: Manual Contact Creation (already supported)
    async create(
        createContactDto: CreateContactDto,
        userId: string,
    ): Promise<ContactResponseDto | DuplicateContactResponseDto> {
        // Validate linked_user_id if provided
        if (createContactDto.linked_user_id) {
            const linkedUser = await this.usersService.findOne(createContactDto.linked_user_id);
            if (!linkedUser) {
                throw new NotFoundException(
                    `User with ID ${createContactDto.linked_user_id} not found`,
                );
            }
        }

        // Validate contact_submission_id if provided
        if (createContactDto.contact_submission_id) {
            const submission = await this.contactSubmissionRepo.findOneById(
                createContactDto.contact_submission_id,
            );
            if (!submission) {
                throw new NotFoundException(
                    `Contact submission with ID ${createContactDto.contact_submission_id} not found`,
                );
            }
        }

        const mapped = ContactMapper.mapToEntity(createContactDto);
        mapped.ownerId = userId;

        // Set defaults for manual entry
        if (!mapped.acquiredVia) {
            mapped.acquiredVia = ACQUIRED_VIA.MANUAL;
        }

        // Generate contact hash for duplicate detection (US-C19)
        const primaryEmail = mapped.emails?.[0]?.email;
        const primaryPhone = mapped.phoneNumbers?.[0]?.rawNumber;
        mapped.contactHash = ContactHashUtil.generateHash(mapped.name, primaryEmail, primaryPhone);

        // Check for duplicates (US-C19)
        const existingContact = await this.repo.findByHash(userId, mapped.contactHash);
        if (existingContact) {
            return {
                duplicate: true,
                existing_contact: ContactMapper.mapToDto(existingContact),
                message: ERROR_MESSAGES.DUPLICATE_CONTACT,
            };
        }

        const entity = this.repo.create(mapped);
        const saved = await this.repo.save(entity);

        this.logger.log(LOG_MESSAGES.CONTACT_CREATED(saved.id, saved.acquiredVia, userId));

        return ContactMapper.mapToDto(saved);
    }

    // US-C1: Scan QR Code & US-C4: Scan Event Badge
    async createScannedContact(
        dto: CreateScannedContactDto,
        userId: string,
    ): Promise<ContactResponseDto | DuplicateContactResponseDto> {
        const mapped = ContactMapper.mapToEntity({
            ...dto,
            user_id: userId,
            acquired_via: ACQUIRED_VIA.SCANNED,
            scanned_type: dto.scanned_type,
        });

        mapped.ownerId = userId;
        mapped.acquiredVia = ACQUIRED_VIA.SCANNED;
        mapped.scannedType = dto.scanned_type;

        const automaticTags: string[] = [];
        if (dto.scanned_type === SCANNED_TYPE.QR_CODE) {
            automaticTags.push(AUTO_TAG.QR_SCAN);
        } else if (dto.scanned_type === SCANNED_TYPE.EVENT_BADGE && dto.event_id) {
            automaticTags.push(AUTO_TAG.EVENT_BADGE);
        }
        mapped.automaticTags = automaticTags;

        const primaryEmail = mapped.emails?.[0]?.email;
        const primaryPhone = mapped.phoneNumbers?.[0]?.rawNumber;
        mapped.contactHash = ContactHashUtil.generateHash(mapped.name, primaryEmail, primaryPhone);

        const existingContact = await this.repo.findByHash(userId, mapped.contactHash);
        if (existingContact) {
            return {
                duplicate: true,
                existing_contact: ContactMapper.mapToDto(existingContact),
                message: ERROR_MESSAGES.DUPLICATE_SCANNED,
            };
        }

        const entity = this.repo.create(mapped);
        const saved = await this.repo.save(entity);

        this.logger.log(LOG_MESSAGES.SCANNED_CONTACT_CREATED(saved.id, dto.scanned_type, userId));

        return ContactMapper.mapToDto(saved);
    }

    // US-C2 & US-C3: Upload Business Card with Smart Caching
    async uploadBusinessCard(
        userId: string,
        file: Express.Multer.File,
        dto: UploadBusinessCardDto,
    ): Promise<BusinessCardResponseDto> {
        // Validate that the contact exists and belongs to the user before proceeding
        if (dto.contact_id) {
            const contact = await this.repo.findOneById(dto.contact_id);
            if (!contact) {
                throw new NotFoundException(`Contact with ID ${dto.contact_id} not found`);
            }
            if (contact.ownerId !== userId) {
                throw new BadRequestException(
                    `Contact with ID ${dto.contact_id} does not belong to the current user`,
                );
            }
        }

        // compute hash + try cached OCR
        const fileHash = computeFileHash(file.buffer);
        const cachedResult = await this.getCachedOcr(userId, fileHash);
        let extractedData: OcrCacheResultDto | null = cachedResult ?? null;
        const cached = !!cachedResult;

        // Upload file to storage and create contact_file record
        const uploadResult = await this.userFileService.uploadFile(
            userId,
            file,
            DOCUMENT_TYPE.BUSINESS_CARD,
            fileHash,
        );

        const side = dto.side || CARD_SIDE.FRONT;
        const docType = DOCUMENT_TYPE.BUSINESS_CARD;

        // Validate: check for existing active file with same contact_id, doc_type, and side
        // to prevent unique constraint violation (uniq_contact_doc_side_active)
        if (dto.contact_id) {
            const existingActiveFile = await this.contactFileRepo.findActiveByContactDocSide(
                dto.contact_id,
                docType,
                side,
            );

            if (existingActiveFile) {
                this.logger.log(
                    `Deactivating existing active ${docType} file (side: ${side}) for contact ${dto.contact_id} before uploading new file`,
                );
                await this.contactFileRepo.deactivate(existingActiveFile.id);
            }
        }

        const contactFile = this.contactFileRepo.create({
            contactId: dto.contact_id || null,
            fileId: uploadResult.id,
            docType,
            side,
            isActive: true,
            processingStatus: cached ? PROCESSING_STATUS.SUCCEEDED : PROCESSING_STATUS.PENDING,
            ocrText: cached && extractedData ? (extractedData.raw_text as string) : null,
            ocrConfidence: cached && extractedData ? (extractedData.confidence as number) : null,
        });

        const savedContactFile = await this.contactFileRepo.save(contactFile);

        this.logger.log(LOG_MESSAGES.BUSINESS_CARD_UPLOADED(uploadResult.id, userId, cached));

        // If not cached, optionally run OCR synchronously (guarded by env & provider availability)
        if (!cached) {
            const ocrResult = await this.performOcrIfEnabled(
                uploadResult,
                savedContactFile,
                file.buffer,
            );
            if (ocrResult) {
                extractedData = ocrResult;
            }
        }

        // Refresh contact_file to get latest processing status (best-effort)
        const refreshedContactFile = await this.contactFileRepo.findById(savedContactFile.id);

        return {
            file_id: uploadResult.id,
            contact_file_id: savedContactFile.id,
            file_url: uploadResult.fileUrl,
            processing_status:
                refreshedContactFile?.processingStatus ||
                savedContactFile.processingStatus ||
                PROCESSING_STATUS.PENDING,
            side: savedContactFile.side || undefined,
            cached,
            extracted_data: extractedData as unknown as BusinessCardResponseDto['extracted_data'],
        };
    }

    // ----------------------
    // Helper functions (small, focused)
    // ----------------------
    private async getCachedOcr(
        userId: string,
        fileHash: string,
    ): Promise<OcrCacheResultDto | null> {
        const existingFiles = await this.userFileRepo.findByOwnerId(userId);
        const cachedFile =
            existingFiles && Array.isArray(existingFiles)
                ? existingFiles.find(
                      (f) => f.sha256 === fileHash && f.purpose === DOCUMENT_TYPE.BUSINESS_CARD,
                  )
                : undefined;

        if (cachedFile?.metadata && typeof cachedFile.metadata === 'object') {
            const metadata = cachedFile.metadata;
            if (metadata.ocr_result) {
                this.logger.log(LOG_MESSAGES.USING_CACHED_OCR(fileHash));
                return metadata.ocr_result as OcrCacheResultDto;
            }
        }
        return null;
    }

    private async performOcrIfEnabled(
        uploadResult: { id: string },
        savedContactFile: { id: string },
        buffer: Buffer,
    ): Promise<OcrCacheResultDto | null> {
        const googleOcrEnabled = this.appConfig.googleOcr.enabled;

        if (!googleOcrEnabled) {
            this.logger.log(LOG_MESSAGES.OCR_DISABLED);
            return null;
        }

        if (!this.ocrService) {
            this.logger.log(LOG_MESSAGES.OCR_NOT_PROVIDED);
            return null;
        }

        try {
            const res = await this.ocrService.detectText(buffer);
            const rawText = res.rawText;
            const confidence = res.confidence;
            const language = res.language || null;

            await this.contactFileRepo.updateProcessingStatus(
                savedContactFile.id,
                PROCESSING_STATUS.SUCCEEDED,
                {
                    ocrText: rawText,
                    ocrConfidence: confidence,
                    ocrEngine: res.engine || OCR_ENGINE.GOOGLE_VISION,
                    ocrLanguage: language,
                    ocrProcessedAt: new Date(),
                },
            );

            const userFile = await this.userFileRepo.findById(uploadResult.id);
            if (userFile) {
                userFile.metadata = {
                    ...userFile.metadata,
                    ocr_result: {
                        raw_text: rawText,
                        confidence,
                        processed_at: new Date().toISOString(),
                        engine: res.engine || OCR_ENGINE.GOOGLE_VISION,
                    },
                };
                await this.userFileRepo.save(userFile);
            }

            return {
                raw_text: rawText,
                confidence,
                engine: res.engine || OCR_ENGINE.GOOGLE_VISION,
            };
        } catch (err) {
            this.logger.error(
                LOG_MESSAGES.OCR_FAILED,
                err instanceof Error ? err.message : String(err),
            );
            return null;
        }
    }

    // US-C6: Event Check-In Contact Creation
    async createEventContacts(
        organizerId: string,
        guestId: string,
        eventId: string,
    ): Promise<EventContactsResponseDto> {
        // Create contact for organizer (guest's info)
        const guestContact = await this.create(
            {
                user_id: organizerId,
                linked_user_id: guestId,
                acquired_via: ACQUIRED_VIA.EVENT,
                event_id: eventId,
            } as CreateContactDto,
            organizerId,
        );

        // Create contact for guest (organizer's info)
        const organizerContact = await this.create(
            {
                user_id: guestId,
                linked_user_id: organizerId,
                acquired_via: ACQUIRED_VIA.EVENT,
                event_id: eventId,
            } as CreateContactDto,
            guestId,
        );

        // Both should be ContactResponseDto (not duplicates in this case)
        if ('duplicate' in guestContact || 'duplicate' in organizerContact) {
            throw new BadRequestException(ERROR_MESSAGES.EVENT_CONTACTS_FAILED);
        }

        return {
            organizer_contact: guestContact,
            guest_contact: organizerContact,
        };
    }

    // US-C7: Lounge Connection Contact Creation
    async createLoungeConnection(
        userId1: string,
        userId2: string,
        loungeSessionId: string,
        eventId?: string,
    ): Promise<EventContactsResponseDto> {
        // Create contact for user1 (user2's info)
        const user2Contact = await this.create(
            {
                user_id: userId1,
                linked_user_id: userId2,
                acquired_via: ACQUIRED_VIA.LOUNGE,
                lounge_session_id: loungeSessionId,
                event_id: eventId,
            } as CreateContactDto,
            userId1,
        );

        // Create contact for user2 (user1's info)
        const user1Contact = await this.create(
            {
                user_id: userId2,
                linked_user_id: userId1,
                acquired_via: ACQUIRED_VIA.LOUNGE,
                lounge_session_id: loungeSessionId,
                event_id: eventId,
            } as CreateContactDto,
            userId2,
        );

        // Both should be ContactResponseDto (not duplicates in this case)
        if ('duplicate' in user2Contact || 'duplicate' in user1Contact) {
            throw new BadRequestException('Failed to create lounge connection contacts');
        }

        return {
            organizer_contact: user2Contact,
            guest_contact: user1Contact,
        };
    }

    // US-C9: Import Contact from Phone (Backend part)
    async importFromPhone(
        userId: string,
        phoneContactData: PhoneContactData,
    ): Promise<ContactResponseDto | DuplicateContactResponseDto> {
        // Map phone contact data to our contact format
        const createDto = {
            user_id: userId,
            name: phoneContactData.name,
            company_name: phoneContactData.company_name,
            title: phoneContactData.title,
            department: phoneContactData.department,
            meeting_notes: phoneContactData.notes,
            acquired_via: ACQUIRED_VIA.PHONE_IMPORT,
            phone_numbers: phoneContactData.phone_numbers?.map((p) => ({
                raw_number: p.number,
                number_type: p.type || 'mobile',
            })),
            emails: phoneContactData.emails?.map((e) => ({
                email: e.email,
                email_type: e.type || 'personal',
            })),
            addresses: phoneContactData.addresses?.map((a) => ({
                raw_address: [a.street, a.city, a.state, a.postal_code, a.country]
                    .filter(Boolean)
                    .join(', '),
                street_name: a.street,
                city: a.city,
                state_province: a.state,
                postal_code: a.postal_code,
                country: a.country,
                address_type: a.type || 'home',
            })),
        } as CreateContactDto;

        this.logger.log(LOG_MESSAGES.CONTACT_CREATED('pending', ACQUIRED_VIA.PHONE_IMPORT, userId));

        return this.create(createDto, userId);
    }

    // US-C8: Search Contacts
    async search(
        userId: string,
        query: string,
        options?: {
            sortBy?: string;
            filterByTag?: string;
            filterByEvent?: string;
            filterByAcquiredVia?: string;
            filterByScannedType?: string;
            isPinned?: boolean;
            isFavorite?: boolean;
        },
    ): Promise<ContactResponseDto[]> {
        const contacts = await this.repo.searchContacts(userId, query, options);
        return contacts.map((c) => ContactMapper.mapToDto(c));
    }

    async findAll(userId?: string): Promise<ContactResponseDto[]> {
        const rows = userId ? await this.repo.findByOwnerId(userId) : await this.repo.findAll();
        return rows.map((contact) => ContactMapper.mapToDto(contact));
    }

    async findOne(id: string, userId: string): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        }
        return ContactMapper.mapToDto(contact);
    }

    async update(
        id: string,
        userId: string,
        updateContactDto: UpdateContactDto,
    ): Promise<ContactResponseDto> {
        const existing = await this.repo.findOneById(id);
        if (!existing) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (existing.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        const mapped = ContactMapper.mapToEntity(updateContactDto);
        Object.assign(existing, mapped);

        const saved = await this.repo.save(existing);
        return ContactMapper.mapToDto(saved);
    }

    // US-C14: Add Custom Tags
    async addTags(id: string, userId: string, tags: string[]): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        // Validate tag count and length
        const existingTags = contact.userTags || [];
        const newTags = [...new Set([...existingTags, ...tags])];

        if (newTags.length > VALIDATION_LIMITS.MAX_TAGS_PER_CONTACT) {
            throw new BadRequestException(ERROR_MESSAGES.MAX_TAGS_EXCEEDED);
        }

        for (const tag of tags) {
            if (tag.length > VALIDATION_LIMITS.MAX_TAG_LENGTH) {
                throw new BadRequestException(ERROR_MESSAGES.TAG_TOO_LONG);
            }
        }

        contact.userTags = newTags;
        const saved = await this.repo.save(contact);
        return ContactMapper.mapToDto(saved);
    }

    async removeTags(id: string, userId: string, tags: string[]): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        const existingTags = contact.userTags || [];
        contact.userTags = existingTags.filter((t) => !tags.includes(t));

        const saved = await this.repo.save(contact);
        return ContactMapper.mapToDto(saved);
    }

    // US-C15: Mark as Favorite
    async toggleFavorite(
        id: string,
        userId: string,
        isFavorite: boolean,
    ): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        contact.isFavorite = isFavorite;
        const saved = await this.repo.save(contact);
        return ContactMapper.mapToDto(saved);
    }

    // US-C16: Pin to Top
    async togglePin(id: string, userId: string, isPinned: boolean): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        contact.isPinned = isPinned;
        const saved = await this.repo.save(contact);
        return ContactMapper.mapToDto(saved);
    }

    // US-C17: Update Meeting Notes
    async updateNotes(id: string, userId: string, notes: string): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        contact.meetingNotes = notes;
        const saved = await this.repo.save(contact);
        return ContactMapper.mapToDto(saved);
    }

    // US-C18: Soft Delete & Restore
    async softDelete(id: string, userId: string): Promise<void> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        await this.repo.softDelete(id);
        this.logger.log(LOG_MESSAGES.CONTACT_SOFT_DELETED(id));
    }

    async restore(id: string, userId: string): Promise<ContactResponseDto> {
        const contact = await this.repo.findOneById(id);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) {
            throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);
        }

        await this.repo.restore(id);
        const restored = await this.repo.findOneById(id);
        return ContactMapper.mapToDto(restored!);
    }

    // Find deleted contacts for a user
    async findDeleted(userId: string): Promise<ContactResponseDto[]> {
        const rows = await this.repo.findDeleted(userId);
        return rows.map((r) => ContactMapper.mapToDto(r));
    }

    // Controller expects remove to soft-delete
    async remove(id: string, userId: string): Promise<void> {
        return this.softDelete(id, userId);
    }

    // Phone numbers, emails, addresses, links - append items to contact
    async createPhoneNumbers(
        contactId: string,
        userId: string,
        dto: CreateContactPhoneNumbersDto,
    ): Promise<ContactPhoneNumberResponseDto[]> {
        const contact = await this.repo.findOneById(contactId);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);

        const newPhoneNumbers = dto.items.map((i) => ContactMapper.mapPhoneNumberDtoToEntity(i));

        contact.phoneNumbers = [...(contact.phoneNumbers || []), ...newPhoneNumbers];
        // ensure primary flags sane
        const saved = await this.repo.save(contact);
        return (saved.phoneNumbers ?? []).map((p) => ContactMapper.mapPhoneNumberToDto(p));
    }

    async createEmails(
        contactId: string,
        userId: string,
        dto: CreateContactEmailsDto,
    ): Promise<ContactEmailResponseDto[]> {
        const contact = await this.repo.findOneById(contactId);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);

        const newEmails = dto.items.map((i) => ContactMapper.mapEmailDtoToEntity(i));
        contact.emails = [...(contact.emails || []), ...newEmails];

        const saved = await this.repo.save(contact);

        return (saved.emails ?? []).map((e) => ContactMapper.mapEmailToDto(e));
    }

    async createAddresses(
        contactId: string,
        userId: string,
        dto: CreateContactAddressesDto,
    ): Promise<ContactAddressResponseDto[]> {
        const contact = await this.repo.findOneById(contactId);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);

        const newAddresses = dto.items.map((i) => ContactMapper.mapAddressDtoToEntity(i));
        contact.addresses = [...(contact.addresses || []), ...newAddresses];

        const saved = await this.repo.save(contact);
        return (saved.addresses ?? []).map((a) => ContactMapper.mapAddressToDto(a));
    }

    async createLinks(
        contactId: string,
        userId: string,
        dto: CreateContactLinksDto,
    ): Promise<ContactLinkResponseDto[]> {
        const contact = await this.repo.findOneById(contactId);
        if (!contact) throw new NotFoundException(ERROR_MESSAGES.CONTACT_NOT_FOUND);
        if (contact.ownerId !== userId) throw new BadRequestException(ERROR_MESSAGES.UNAUTHORIZED);

        const newLinks = dto.items.map((i) => ContactMapper.mapLinkDtoToEntity(i));
        contact.links = [...(contact.links || []), ...newLinks];

        const saved = await this.repo.save(contact);
        return (saved.links ?? []).map((l) => ContactMapper.mapLinkToDto(l));
    }
}
