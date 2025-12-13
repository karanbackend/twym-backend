import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ContactsService } from '../../../src/core/contacts/contacts.service';
import { ContactRepository } from '../../../src/core/contacts/contact.repository';
import { ContactFileRepository } from '../../../src/core/contacts/contact-file.repository';
import { UserFileService } from '../../../src/core/users/user-file.service';
import { UserFileRepository } from '../../../src/core/users/user-file.repository';
import { UsersService } from '../../../src/core/users/users.service';
import { ContactSubmissionRepository } from '../../../src/core/contact-forms/contact-submission.repository';
import { AppConfig } from '../../../src/common/config/app.config';
import { STORAGE_SERVICE } from '../../../src/common/storage';
import { OCR_SERVICE } from '../../../src/common/ocr';
import { Contact } from '../../../src/core/contacts/entities/contact.entity';
import {
    ACQUIRED_VIA,
    SCANNED_TYPE,
    AUTO_TAG,
    ERROR_MESSAGES,
    PROCESSING_STATUS,
    DOCUMENT_TYPE,
    CARD_SIDE,
    VALIDATION_LIMITS,
} from '../../../src/core/contacts/contacts.constants';
import { computeFileHash } from '../../../src/common/utils/hash.util';

describe('ContactsService', () => {
    let service: ContactsService;
    let contactRepo: jest.Mocked<ContactRepository>;
    let contactFileRepo: jest.Mocked<ContactFileRepository>;
    let userFileService: jest.Mocked<UserFileService>;
    let userFileRepo: jest.Mocked<UserFileRepository>;
    let usersService: jest.Mocked<UsersService>;
    let ocrService: jest.Mocked<{ detectText: jest.Mock }>;
    let appConfig: { googleOcr: { enabled: boolean } };

    const mockUserId = 'user-123';
    const mockContactId = 'contact-123';

    beforeEach(async () => {
        const mockContactRepo = {
            create: jest.fn(),
            save: jest.fn(),
            findOneById: jest.fn(),
            findByOwnerId: jest.fn(),
            findByHash: jest.fn(),
            searchContacts: jest.fn(),
            softDelete: jest.fn(),
            restore: jest.fn(),
            findDeleted: jest.fn(),
            findAll: jest.fn(),
        };

        const mockContactFileRepo = {
            create: jest.fn(),
            save: jest.fn(),
            findById: jest.fn(),
            findByFileId: jest.fn(),
            updateProcessingStatus: jest.fn(),
            findActiveByContactDocSide: jest.fn(),
            deactivate: jest.fn(),
        };

        const mockUserFileService = {
            uploadFile: jest.fn(),
        };

        const mockUserFileRepo = {
            findByOwnerId: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
        };

        const mockStorageService = {
            uploadFile: jest.fn(),
        };

        const mockOcrService = {
            detectText: jest.fn(),
        };

        const mockUsersService = {
            findOne: jest.fn(),
        };

        const mockContactSubmissionRepo = {
            findOneById: jest.fn(),
        };

        // inline mocked AppConfig to avoid unsafe assignment warnings

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactsService,
                { provide: ContactRepository, useValue: mockContactRepo },
                {
                    provide: ContactFileRepository,
                    useValue: mockContactFileRepo,
                },
                { provide: UserFileService, useValue: mockUserFileService },
                { provide: UserFileRepository, useValue: mockUserFileRepo },
                { provide: UsersService, useValue: mockUsersService },
                {
                    provide: ContactSubmissionRepository,
                    useValue: mockContactSubmissionRepo,
                },
                { provide: STORAGE_SERVICE, useValue: mockStorageService },
                { provide: OCR_SERVICE, useValue: mockOcrService },
                {
                    provide: AppConfig,
                    useValue: {
                        googleOcr: { enabled: false },
                    } as unknown as AppConfig,
                },
            ],
        }).compile();

        service = module.get<ContactsService>(ContactsService);
        contactRepo = module.get<ContactRepository, jest.Mocked<ContactRepository>>(
            ContactRepository,
        );
        contactFileRepo = module.get<ContactFileRepository, jest.Mocked<ContactFileRepository>>(
            ContactFileRepository,
        );
        userFileService = module.get<UserFileService, jest.Mocked<UserFileService>>(
            UserFileService,
        );
        userFileRepo = module.get<UserFileRepository, jest.Mocked<UserFileRepository>>(
            UserFileRepository,
        );
        usersService = module.get<UsersService, jest.Mocked<UsersService>>(UsersService);
        // OCR_SERVICE is an injection token; keep typed as mocked object with detectText
        ocrService = module.get<unknown, jest.Mocked<{ detectText: jest.Mock }>>(OCR_SERVICE);
        appConfig = module.get<AppConfig>(AppConfig);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('create - US-C5: Manual Contact Creation', () => {
        it('should create a new contact successfully', async () => {
            const createDto = {
                name: 'John Doe',
                company_name: 'Acme Corp',
                phone_numbers: [{ raw_number: '+1234567890' }],
                emails: [{ email: 'john@example.com' }],
            };

            const mockContact = {
                id: mockContactId,
                name: 'John Doe',
                ownerId: mockUserId,
                acquiredVia: ACQUIRED_VIA.MANUAL,
            } as Contact;

            contactRepo.findByHash.mockResolvedValue(null);
            contactRepo.create.mockReturnValue(mockContact);
            contactRepo.save.mockResolvedValue(mockContact);

            const result = await service.create(createDto as any, mockUserId);

            expect(result).toBeDefined();
            expect('duplicate' in result).toBe(false);
            expect(contactRepo.findByHash).toHaveBeenCalled();
            expect(contactRepo.save).toHaveBeenCalled();
        });

        it('should return duplicate response when contact already exists', async () => {
            const createDto = {
                name: 'John Doe',
                emails: [{ email: 'john@example.com' }],
            };

            const existingContact = {
                id: 'existing-id',
                name: 'John Doe',
                ownerId: mockUserId,
            } as Contact;

            contactRepo.findByHash.mockResolvedValue(existingContact);

            const result = await service.create(createDto as any, mockUserId);

            expect(result).toHaveProperty('duplicate', true);
            expect(result).toHaveProperty('message', ERROR_MESSAGES.DUPLICATE_CONTACT);
            expect(contactRepo.save).not.toHaveBeenCalled();
        });

        it('should set default acquired_via to MANUAL', async () => {
            const createDto = {
                name: 'John Doe',
            };

            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
            };

            contactRepo.findByHash.mockResolvedValue(null);
            contactRepo.create.mockImplementation((entity) => entity as Contact);
            contactRepo.save.mockResolvedValue(mockContact as Contact);

            await service.create(createDto as any, mockUserId);

            const savedContact = contactRepo.save.mock.calls[0][0];
            expect(savedContact.acquiredVia).toBe(ACQUIRED_VIA.MANUAL);
        });
    });

    describe('createScannedContact - US-C1: Scan QR Code & US-C4: Scan Event Badge', () => {
        it('should create QR scanned contact with automatic tag', async () => {
            const dto = {
                name: 'Jane Smith',
                scanned_type: SCANNED_TYPE.QR_CODE,
                phone_numbers: [{ raw_number: '+9876543210' }],
            };

            const mockContact = {
                id: mockContactId,
                name: 'Jane Smith',
                ownerId: mockUserId,
                automaticTags: [AUTO_TAG.QR_SCAN],
            } as Contact;

            contactRepo.findByHash.mockResolvedValue(null);
            contactRepo.create.mockReturnValue(mockContact);
            contactRepo.save.mockResolvedValue(mockContact);

            const result = await service.createScannedContact(dto as any, mockUserId);

            expect(result).toBeDefined();
            expect('duplicate' in result).toBe(false);
            expect(contactRepo.save).toHaveBeenCalled();
        });

        it('should create event badge scanned contact with automatic tag', async () => {
            const dto = {
                name: 'Event Attendee',
                scanned_type: SCANNED_TYPE.EVENT_BADGE,
                event_id: 'event-123',
            };

            const mockContact = {
                id: mockContactId,
                name: 'Event Attendee',
                ownerId: mockUserId,
                automaticTags: [AUTO_TAG.EVENT_BADGE],
            } as Contact;

            contactRepo.findByHash.mockResolvedValue(null);
            contactRepo.create.mockReturnValue(mockContact);
            contactRepo.save.mockResolvedValue(mockContact);

            const result = await service.createScannedContact(dto as any, mockUserId);

            expect(result).toBeDefined();
            expect('duplicate' in result).toBe(false);
        });

        it('should return duplicate for scanned contact', async () => {
            const dto = {
                name: 'Jane Smith',
                scanned_type: SCANNED_TYPE.QR_CODE,
            };

            const existingContact = {
                id: 'existing-id',
                name: 'Jane Smith',
            } as Contact;

            contactRepo.findByHash.mockResolvedValue(existingContact);

            const result = await service.createScannedContact(dto as any, mockUserId);

            expect(result).toHaveProperty('duplicate', true);
            expect(result).toHaveProperty('message', ERROR_MESSAGES.DUPLICATE_SCANNED);
        });
    });

    describe('uploadBusinessCard - US-C2 & US-C3: Upload Business Card', () => {
        it('should upload business card without OCR when disabled', async () => {
            const file = {
                buffer: Buffer.from('fake-image'),
                originalname: 'card.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
            } as Express.Multer.File;

            const dto = {
                side: CARD_SIDE.FRONT,
            };

            const mockUploadResult = {
                id: 'file-123',
                fileUrl: 'https://example.com/file.jpg',
            };

            const mockContactFile = {
                id: 'contact-file-123',
                fileId: 'file-123',
                processingStatus: PROCESSING_STATUS.PENDING,
            };

            userFileService.uploadFile.mockResolvedValue(mockUploadResult as any);
            userFileRepo.findByOwnerId.mockResolvedValue([]);
            contactFileRepo.create.mockReturnValue(mockContactFile as any);
            contactFileRepo.save.mockResolvedValue(mockContactFile as any);
            contactFileRepo.findById.mockResolvedValue(mockContactFile as any);

            const result = await service.uploadBusinessCard(mockUserId, file, dto as any);

            expect(result).toBeDefined();
            expect(result.file_id).toBe('file-123');
            expect(result.processing_status).toBe(PROCESSING_STATUS.PENDING);
            expect(result.cached).toBe(false);
        });

        it('should use cached OCR result if file hash exists', async () => {
            const fileBuffer = Buffer.from('fake-image');
            const file = {
                buffer: fileBuffer,
                originalname: 'card.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
            } as Express.Multer.File;

            const dto = {
                side: CARD_SIDE.FRONT,
            };

            // Compute the actual hash that will be used
            const actualFileHash = computeFileHash(fileBuffer);

            const cachedOcrResult = {
                raw_text: 'Cached OCR Text',
                confidence: 0.95,
                engine: 'google_vision',
            };

            const mockCachedFile = {
                id: 'cached-file-id',
                sha256: actualFileHash, // Use the actual computed hash
                purpose: DOCUMENT_TYPE.BUSINESS_CARD,
                metadata: {
                    ocr_result: cachedOcrResult,
                },
            };

            const mockUploadResult = {
                id: 'file-123',
                fileUrl: 'https://example.com/file.jpg',
            };

            const mockContactFile = {
                id: 'contact-file-123',
                fileId: 'file-123',
                processingStatus: PROCESSING_STATUS.SUCCEEDED,
            };

            userFileRepo.findByOwnerId.mockResolvedValue([mockCachedFile] as any);
            userFileService.uploadFile.mockResolvedValue(mockUploadResult as any);
            contactFileRepo.create.mockReturnValue(mockContactFile as any);
            contactFileRepo.save.mockResolvedValue(mockContactFile as any);
            contactFileRepo.findById.mockResolvedValue(mockContactFile as any);

            const result = await service.uploadBusinessCard(mockUserId, file, dto as any);

            expect(result.cached).toBe(true);
            expect(result.extracted_data).toBeDefined();
            expect(result.processing_status).toBe(PROCESSING_STATUS.SUCCEEDED);
        });

        it('should run OCR synchronously when enabled', async () => {
            appConfig.googleOcr.enabled = true;

            const file = {
                buffer: Buffer.from('fake-image'),
                originalname: 'card.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
            } as Express.Multer.File;

            const dto = {
                side: CARD_SIDE.FRONT,
            };

            const ocrResult = {
                rawText: 'OCR Extracted Text',
                confidence: 0.92,
                language: 'en',
                engine: 'google_vision',
            };

            const mockUploadResult = {
                id: 'file-123',
                fileUrl: 'https://example.com/file.jpg',
            };

            const mockContactFile = {
                id: 'contact-file-123',
                fileId: 'file-123',
                processingStatus: PROCESSING_STATUS.PENDING,
            };

            userFileRepo.findByOwnerId.mockResolvedValue([]);
            userFileService.uploadFile.mockResolvedValue(mockUploadResult as any);
            contactFileRepo.create.mockReturnValue(mockContactFile as any);
            contactFileRepo.save.mockResolvedValue(mockContactFile as any);
            contactFileRepo.findById.mockResolvedValue({
                ...mockContactFile,
                processingStatus: PROCESSING_STATUS.SUCCEEDED,
            } as any);
            userFileRepo.findById.mockResolvedValue({ metadata: {} } as any);
            ocrService.detectText.mockResolvedValue(ocrResult);

            const result = await service.uploadBusinessCard(mockUserId, file, dto as any);

            expect(ocrService.detectText).toHaveBeenCalledWith(file.buffer);
            expect(result.extracted_data).toBeDefined();
        });

        it('should deactivate existing active file before uploading duplicate with same contact_id, doc_type, and side', async () => {
            const file = {
                buffer: Buffer.from('fake-image'),
                originalname: 'card.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
            } as Express.Multer.File;

            const contactId = 'contact-123';
            const dto = {
                contact_id: contactId,
                side: CARD_SIDE.FRONT,
            };

            const existingActiveFile = {
                id: 'existing-contact-file-id',
                contactId,
                docType: DOCUMENT_TYPE.BUSINESS_CARD,
                side: CARD_SIDE.FRONT,
                isActive: true,
            };

            const mockUploadResult = {
                id: 'file-456',
                fileUrl: 'https://example.com/new-file.jpg',
            };

            const mockContactFile = {
                id: 'contact-file-456',
                fileId: 'file-456',
                processingStatus: PROCESSING_STATUS.PENDING,
            };

            contactRepo.findOneById.mockResolvedValue({
                id: contactId,
                ownerId: mockUserId,
            } as any);
            userFileRepo.findByOwnerId.mockResolvedValue([]);
            userFileService.uploadFile.mockResolvedValue(mockUploadResult as any);
            contactFileRepo.findActiveByContactDocSide.mockResolvedValue(existingActiveFile as any);
            contactFileRepo.deactivate.mockResolvedValue({
                ...existingActiveFile,
                isActive: false,
            } as any);
            contactFileRepo.create.mockReturnValue(mockContactFile as any);
            contactFileRepo.save.mockResolvedValue(mockContactFile as any);
            contactFileRepo.findById.mockResolvedValue(mockContactFile as any);

            const result = await service.uploadBusinessCard(mockUserId, file, dto as any);

            expect(contactFileRepo.findActiveByContactDocSide).toHaveBeenCalledWith(
                contactId,
                DOCUMENT_TYPE.BUSINESS_CARD,
                CARD_SIDE.FRONT,
            );
            expect(contactFileRepo.deactivate).toHaveBeenCalledWith(existingActiveFile.id);
            expect(result).toBeDefined();
            expect(result.file_id).toBe('file-456');
        });

        it('should not call deactivate if no existing active file found', async () => {
            const file = {
                buffer: Buffer.from('fake-image'),
                originalname: 'card.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
            } as Express.Multer.File;

            const contactId = 'contact-123';
            const dto = {
                contact_id: contactId,
                side: CARD_SIDE.FRONT,
            };

            const mockUploadResult = {
                id: 'file-456',
                fileUrl: 'https://example.com/new-file.jpg',
            };

            const mockContactFile = {
                id: 'contact-file-456',
                fileId: 'file-456',
                processingStatus: PROCESSING_STATUS.PENDING,
            };

            contactRepo.findOneById.mockResolvedValue({
                id: contactId,
                ownerId: mockUserId,
            } as any);
            userFileRepo.findByOwnerId.mockResolvedValue([]);
            userFileService.uploadFile.mockResolvedValue(mockUploadResult as any);
            contactFileRepo.findActiveByContactDocSide.mockResolvedValue(null);
            contactFileRepo.create.mockReturnValue(mockContactFile as any);
            contactFileRepo.save.mockResolvedValue(mockContactFile as any);
            contactFileRepo.findById.mockResolvedValue(mockContactFile as any);

            const result = await service.uploadBusinessCard(mockUserId, file, dto as any);

            expect(contactFileRepo.findActiveByContactDocSide).toHaveBeenCalledWith(
                contactId,
                DOCUMENT_TYPE.BUSINESS_CARD,
                CARD_SIDE.FRONT,
            );
            expect(contactFileRepo.deactivate).not.toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.file_id).toBe('file-456');
        });
    });

    describe('createEventContacts - US-C6: Event Check-In Contact Creation', () => {
        it('should create contacts for both organizer and guest', async () => {
            const organizerId = 'organizer-123';
            const guestId = 'guest-456';
            const eventId = 'event-789';

            const mockOrganizerContact = {
                id: 'contact-org',
                ownerId: organizerId,
                linkedUserId: guestId,
            } as Contact;

            const mockGuestContact = {
                id: 'contact-guest',
                ownerId: guestId,
                linkedUserId: organizerId,
            } as Contact;

            // Mock user lookups for linked_user_id validation
            usersService.findOne
                .mockResolvedValueOnce({ id: guestId } as any) // First create() call checks guestId
                .mockResolvedValueOnce({ id: organizerId } as any); // Second create() call checks organizerId

            contactRepo.findByHash.mockResolvedValue(null);
            contactRepo.create
                .mockReturnValueOnce(mockOrganizerContact)
                .mockReturnValueOnce(mockGuestContact);
            contactRepo.save
                .mockResolvedValueOnce(mockOrganizerContact)
                .mockResolvedValueOnce(mockGuestContact);

            const result = await service.createEventContacts(organizerId, guestId, eventId);

            expect(result).toBeDefined();
            expect(result.organizer_contact).toBeDefined();
            expect(result.guest_contact).toBeDefined();
            expect(contactRepo.save).toHaveBeenCalledTimes(2);
        });

        it('should throw BadRequestException if duplicate detected', async () => {
            const organizerId = 'organizer-123';
            const guestId = 'guest-456';
            const eventId = 'event-789';

            const existingContact = {
                id: 'existing',
                ownerId: organizerId,
            } as Contact;

            // Mock user lookups for linked_user_id validation (both create calls need to pass validation)
            usersService.findOne
                .mockResolvedValueOnce({ id: guestId } as any) // First create() call
                .mockResolvedValueOnce({ id: organizerId } as any); // Second create() call

            contactRepo.findByHash.mockResolvedValue(existingContact);

            await expect(
                service.createEventContacts(organizerId, guestId, eventId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('search - US-C8: Search Contacts', () => {
        it('should search contacts with query string', async () => {
            const query = 'john';
            const mockContacts = [
                { id: '1', name: 'John Doe', ownerId: mockUserId },
                { id: '2', name: 'Johnny Smith', ownerId: mockUserId },
            ] as Contact[];

            contactRepo.searchContacts.mockResolvedValue(mockContacts);

            const result = await service.search(mockUserId, query);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(contactRepo.searchContacts).toHaveBeenCalledWith(mockUserId, query, undefined);
        });

        it('should search contacts with filters', async () => {
            const query = '';
            const options = {
                filterByTag: 'vip',
                sortBy: 'name',
                isPinned: true,
            };

            const mockContacts = [{ id: '1', name: 'John Doe', isPinned: true }] as Contact[];

            contactRepo.searchContacts.mockResolvedValue(mockContacts);

            const result = await service.search(mockUserId, query, options);

            expect(result).toBeDefined();
            expect(contactRepo.searchContacts).toHaveBeenCalledWith(mockUserId, query, options);
        });
    });

    describe('findAll', () => {
        it('should return all contacts for a user', async () => {
            const mockContacts = [
                { id: '1', name: 'Contact 1', ownerId: mockUserId },
                { id: '2', name: 'Contact 2', ownerId: mockUserId },
            ] as Contact[];

            contactRepo.findByOwnerId.mockResolvedValue(mockContacts);

            const result = await service.findAll(mockUserId);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });

        it('should return all contacts when no userId provided', async () => {
            const mockContacts = [
                { id: '1', name: 'Contact 1' },
                { id: '2', name: 'Contact 2' },
            ] as Contact[];

            contactRepo.findAll.mockResolvedValue(mockContacts);

            const result = await service.findAll();

            expect(result).toBeDefined();
            expect(contactRepo.findAll).toHaveBeenCalled();
        });
    });

    describe('findOne', () => {
        it('should return a contact by id', async () => {
            const mockContact = {
                id: mockContactId,
                name: 'John Doe',
                ownerId: mockUserId,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);

            const result = await service.findOne(mockContactId, mockUserId);

            expect(result).toBeDefined();
            expect(result.id).toBe(mockContactId);
        });

        it('should throw NotFoundException if contact not found', async () => {
            contactRepo.findOneById.mockResolvedValue(null);

            await expect(service.findOne('nonexistent', mockUserId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw NotFoundException if contact belongs to different user', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: 'different-user',
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);

            await expect(service.findOne(mockContactId, mockUserId)).rejects.toThrow(
                NotFoundException,
            );
        });
    });

    describe('update', () => {
        it('should update a contact successfully', async () => {
            const updateDto = {
                name: 'Updated Name',
                company_name: 'New Company',
            };

            const existingContact = {
                id: mockContactId,
                name: 'Old Name',
                ownerId: mockUserId,
            } as Contact;

            const updatedContact = {
                ...existingContact,
                name: 'Updated Name',
                companyName: 'New Company',
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(existingContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.update(mockContactId, mockUserId, updateDto as any);

            expect(result).toBeDefined();
            expect(contactRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException if contact not found', async () => {
            contactRepo.findOneById.mockResolvedValue(null);

            await expect(service.update(mockContactId, mockUserId, {} as any)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if user does not own contact', async () => {
            const existingContact = {
                id: mockContactId,
                ownerId: 'different-user',
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(existingContact);

            await expect(service.update(mockContactId, mockUserId, {} as any)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('addTags - US-C14: Add Custom Tags', () => {
        it('should add tags to contact', async () => {
            const tags = ['vip', 'client'];
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                userTags: [],
            } as unknown as Contact;

            const updatedContact = {
                ...mockContact,
                userTags: tags,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.addTags(mockContactId, mockUserId, tags);

            expect(result).toBeDefined();
            expect(contactRepo.save).toHaveBeenCalled();
        });

        it('should not add duplicate tags', async () => {
            const existingTags = ['vip'];
            const newTags = ['vip', 'client'];
            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                userTags: existingTags,
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);
            contactRepo.save.mockResolvedValue({
                ...(mockContact as Contact),
                userTags: ['vip', 'client'],
            } as Contact);

            await service.addTags(mockContactId, mockUserId, newTags);

            const savedContact = contactRepo.save.mock.calls[0][0];
            expect(savedContact.userTags).toEqual(['vip', 'client']);
        });

        it('should throw error if max tags exceeded', async () => {
            const tooManyTags = Array.from({ length: 101 }, (_, i) => `tag-${i}`); // Exceed 100 limit
            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                userTags: [],
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);

            await expect(service.addTags(mockContactId, mockUserId, tooManyTags)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should throw error if tag too long', async () => {
            const longTag = 'a'.repeat(VALIDATION_LIMITS.MAX_TAG_LENGTH + 1);
            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                userTags: [],
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);

            await expect(service.addTags(mockContactId, mockUserId, [longTag])).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('removeTags', () => {
        it('should remove tags from contact', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                contactType: 'external',
                acquiredVia: ACQUIRED_VIA.MANUAL,
                userTags: ['vip', 'client', 'partner'],
            } as Contact;

            const updatedContact = {
                ...mockContact,
                userTags: ['partner'],
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.removeTags(mockContactId, mockUserId, ['vip', 'client']);

            expect(result).toBeDefined();
            expect(contactRepo.save).toHaveBeenCalled();
        });
    });

    describe('toggleFavorite - US-C15: Mark as Favorite', () => {
        it('should toggle favorite to true', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                isFavorite: false,
            } as Contact;

            const updatedContact = {
                ...mockContact,
                isFavorite: true,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.toggleFavorite(mockContactId, mockUserId, true);

            expect(result).toBeDefined();
            expect(contactRepo.save).toHaveBeenCalled();
        });

        it('should toggle favorite to false', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                isFavorite: true,
            } as Contact;

            const updatedContact = {
                ...mockContact,
                isFavorite: false,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.toggleFavorite(mockContactId, mockUserId, false);

            expect(result).toBeDefined();
        });
    });

    describe('togglePin - US-C16: Pin to Top', () => {
        it('should toggle pin to true', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                isPinned: false,
            } as Contact;

            const updatedContact = {
                ...mockContact,
                isPinned: true,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.togglePin(mockContactId, mockUserId, true);

            expect(result).toBeDefined();
        });
    });

    describe('updateNotes - US-C17: Update Meeting Notes', () => {
        it('should update meeting notes', async () => {
            const notes = 'Important meeting notes';
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                meetingNotes: null,
            } as Contact;

            const updatedContact = {
                ...mockContact,
                meetingNotes: notes,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.save.mockResolvedValue(updatedContact);

            const result = await service.updateNotes(mockContactId, mockUserId, notes);

            expect(result).toBeDefined();
            expect(contactRepo.save).toHaveBeenCalled();
        });
    });

    describe('softDelete - US-C18: Soft Delete', () => {
        it('should soft delete a contact', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);
            contactRepo.softDelete.mockResolvedValue(undefined);

            await service.softDelete(mockContactId, mockUserId);

            expect(contactRepo.softDelete).toHaveBeenCalledWith(mockContactId);
        });

        it('should throw NotFoundException if contact not found', async () => {
            contactRepo.findOneById.mockResolvedValue(null);

            await expect(service.softDelete('nonexistent', mockUserId)).rejects.toThrow(
                NotFoundException,
            );
        });

        it('should throw BadRequestException if user does not own contact', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: 'different-user',
            } as Contact;

            contactRepo.findOneById.mockResolvedValue(mockContact);

            await expect(service.softDelete(mockContactId, mockUserId)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('restore', () => {
        it('should restore a soft-deleted contact', async () => {
            const mockContact = {
                id: mockContactId,
                ownerId: mockUserId,
                deletedAt: new Date(),
            } as Contact;

            const restoredContact = {
                ...mockContact,
                deletedAt: null,
            } as Contact;

            contactRepo.findOneById
                .mockResolvedValueOnce(mockContact)
                .mockResolvedValueOnce(restoredContact);
            contactRepo.restore.mockResolvedValue(undefined);

            const result = await service.restore(mockContactId, mockUserId);

            expect(result).toBeDefined();
            expect(contactRepo.restore).toHaveBeenCalledWith(mockContactId);
        });
    });

    describe('findDeleted', () => {
        it('should find all deleted contacts for a user', async () => {
            const mockDeletedContacts = [
                { id: '1', name: 'Deleted 1', deletedAt: new Date() },
                { id: '2', name: 'Deleted 2', deletedAt: new Date() },
            ] as Contact[];

            contactRepo.findDeleted.mockResolvedValue(mockDeletedContacts);

            const result = await service.findDeleted(mockUserId);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
            expect(result.length).toBe(2);
        });
    });

    describe('createPhoneNumbers', () => {
        it('should add phone numbers to contact', async () => {
            const dto = {
                items: [
                    { raw_number: '+1234567890', number_type: 'mobile' },
                    { raw_number: '+0987654321', number_type: 'work' },
                ],
            };

            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                contactType: 'external',
                acquiredVia: ACQUIRED_VIA.MANUAL,
                phoneNumbers: [],
            };

            const updatedContact: Partial<Contact> = {
                ...(mockContact as Contact),
                phoneNumbers: [
                    { rawNumber: '+1234567890', numberType: 'mobile' },
                    { rawNumber: '+0987654321', numberType: 'work' },
                ],
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);
            contactRepo.save.mockResolvedValue(updatedContact as Contact);

            const result = await service.createPhoneNumbers(mockContactId, mockUserId, dto as any);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });

        it('should throw NotFoundException if contact not found', async () => {
            contactRepo.findOneById.mockResolvedValue(null);

            await expect(
                service.createPhoneNumbers(mockContactId, mockUserId, {
                    items: [],
                } as any),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('createEmails', () => {
        it('should add emails to contact', async () => {
            const dto = {
                items: [
                    { email: 'work@example.com', email_type: 'work' },
                    { email: 'personal@example.com', email_type: 'personal' },
                ],
            };

            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                contactType: 'external',
                acquiredVia: ACQUIRED_VIA.MANUAL,
                emails: [],
            };

            const updatedContact: Partial<Contact> = {
                ...(mockContact as Contact),
                emails: [
                    { email: 'work@example.com', emailType: 'work' },
                    { email: 'personal@example.com', emailType: 'personal' },
                ],
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);
            contactRepo.save.mockResolvedValue(updatedContact as Contact);

            const result = await service.createEmails(mockContactId, mockUserId, dto as any);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('createAddresses', () => {
        it('should add addresses to contact', async () => {
            const dto = {
                items: [
                    {
                        street_name: 'Main St',
                        city: 'New York',
                        address_type: 'work',
                    },
                ],
            };

            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                contactType: 'external',
                acquiredVia: ACQUIRED_VIA.MANUAL,
                addresses: [],
            };

            const updatedContact: Partial<Contact> = {
                ...(mockContact as Contact),
                addresses: [
                    {
                        streetName: 'Main St',
                        city: 'New York',
                        addressType: 'work',
                    },
                ],
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);
            contactRepo.save.mockResolvedValue(updatedContact as Contact);

            const result = await service.createAddresses(mockContactId, mockUserId, dto as any);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('createLinks', () => {
        it('should add links to contact', async () => {
            const dto = {
                items: [
                    {
                        url: 'https://linkedin.com/in/user',
                        platform: 'LinkedIn',
                    },
                    { url: 'https://twitter.com/user', platform: 'Twitter' },
                ],
            };

            const mockContact: Partial<Contact> = {
                id: mockContactId,
                ownerId: mockUserId,
                contactType: 'external',
                acquiredVia: ACQUIRED_VIA.MANUAL,
                links: [],
            };

            const updatedContact: Partial<Contact> = {
                ...(mockContact as Contact),
                links: [
                    {
                        url: 'https://linkedin.com/in/user',
                        platform: 'LinkedIn',
                    },
                    { url: 'https://twitter.com/user', platform: 'Twitter' },
                ],
            };

            contactRepo.findOneById.mockResolvedValue(mockContact as Contact);
            contactRepo.save.mockResolvedValue(updatedContact as Contact);

            const result = await service.createLinks(mockContactId, mockUserId, dto as any);

            expect(result).toBeDefined();
            expect(Array.isArray(result)).toBe(true);
        });
    });
});
