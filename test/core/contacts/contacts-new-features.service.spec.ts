import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ContactsService } from '../../../src/core/contacts/contacts.service';
import { ContactRepository } from '../../../src/core/contacts/contact.repository';
import { ContactFileRepository } from '../../../src/core/contacts/contact-file.repository';
import { UserFileService } from '../../../src/core/users/user-file.service';
import { UserFileRepository } from '../../../src/core/users/user-file.repository';
import { UsersService } from '../../../src/core/users/users.service';
import { ContactSubmissionRepository } from '../../../src/core/contact-forms/contact-submission.repository';
import { AppConfig } from '../../../src/common/config/app.config';
import { OCR_SERVICE } from '../../../src/common/ocr';
import { Contact } from '../../../src/core/contacts/entities/contact.entity';
import { ACQUIRED_VIA } from '../../../src/core/contacts/contacts.constants';
import type { PhoneContactData } from '../../../src/core/contacts/types/phone-contact-data.interface';

describe('ContactsService - New Features', () => {
    let service: ContactsService;
    let mockContactRepo: Partial<ContactRepository>;
    let mockContactFileRepo: Partial<ContactFileRepository>;
    let mockUserFileService: Partial<UserFileService>;
    let mockUserFileRepo: Partial<UserFileRepository>;
    let mockUsersService: jest.Mocked<UsersService>;
    let mockAppConfig: Partial<AppConfig>;

    const mockUserId = 'user-123';
    const mockUserId2 = 'user-456';
    const mockLoungeSessionId = 'lounge-789';
    const mockEventId = 'event-abc';

    beforeEach(async () => {
        mockContactRepo = {
            create: jest.fn((data) => data as Contact),
            save: jest.fn((contact) => Promise.resolve(contact as Contact)),
            findOneById: jest.fn(),
            findByHash: jest.fn(),
        };

        mockContactFileRepo = {
            create: jest.fn(),
            save: jest.fn(),
            findActiveByContactDocSide: jest.fn(),
            deactivate: jest.fn(),
        };

        mockUserFileService = {
            uploadFile: jest.fn(),
        };

        mockUserFileRepo = {
            findByOwnerId: jest.fn(),
            findById: jest.fn(),
            save: jest.fn(),
        };

        mockAppConfig = {
            googleOcr: { enabled: false },
            frontendUrl: 'https://twym.com',
            apiUrl: 'https://api.twym.com',
        };

        const mockUsersServiceValue = {
            findOne: jest.fn(),
        };

        const mockContactSubmissionRepo = {
            findOneById: jest.fn(),
        };

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
                { provide: UsersService, useValue: mockUsersServiceValue },
                {
                    provide: ContactSubmissionRepository,
                    useValue: mockContactSubmissionRepo,
                },
                { provide: AppConfig, useValue: mockAppConfig },
                { provide: OCR_SERVICE, useValue: null },
            ],
        }).compile();

        service = module.get<ContactsService>(ContactsService);
        mockUsersService = module.get<UsersService, jest.Mocked<UsersService>>(UsersService);
    });

    describe('createLoungeConnection (US-C7)', () => {
        it('should create bidirectional contacts for lounge connection', async () => {
            // Mock user lookups for linked_user_id validation
            mockUsersService.findOne
                .mockResolvedValueOnce({ id: mockUserId2 } as any)
                .mockResolvedValueOnce({ id: mockUserId } as any);

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            const result = await service.createLoungeConnection(
                mockUserId,
                mockUserId2,
                mockLoungeSessionId,
                mockEventId,
            );

            expect(result).toBeDefined();
            expect(result.organizer_contact).toBeDefined();
            expect(result.guest_contact).toBeDefined();

            // Verify save was called twice (once for each contact)
            expect(saveSpy).toHaveBeenCalledTimes(2);

            // Verify lounge_session_id is set
            const firstCall = saveSpy.mock.calls[0][0] as Contact;
            expect(firstCall.loungeSessionId).toBe(mockLoungeSessionId);
        });

        it('should create lounge contacts with event association', async () => {
            // Mock user lookups for linked_user_id validation
            mockUsersService.findOne
                .mockResolvedValueOnce({ id: mockUserId2 } as any)
                .mockResolvedValueOnce({ id: mockUserId } as any);

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.createLoungeConnection(
                mockUserId,
                mockUserId2,
                mockLoungeSessionId,
                mockEventId,
            );

            const firstCall = saveSpy.mock.calls[0][0] as Contact;
            expect(firstCall.eventId).toBe(mockEventId);
            expect(firstCall.loungeSessionId).toBe(mockLoungeSessionId);
        });

        it('should create lounge contacts without event', async () => {
            // Mock user lookups for linked_user_id validation
            mockUsersService.findOne
                .mockResolvedValueOnce({ id: mockUserId2 } as any)
                .mockResolvedValueOnce({ id: mockUserId } as any);

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.createLoungeConnection(mockUserId, mockUserId2, mockLoungeSessionId);

            const firstCall = saveSpy.mock.calls[0][0] as Contact;
            expect(firstCall.eventId).toBeUndefined();
            expect(firstCall.loungeSessionId).toBe(mockLoungeSessionId);
        });

        it('should set correct acquired_via for lounge contacts', async () => {
            // Mock user lookups for linked_user_id validation
            mockUsersService.findOne
                .mockResolvedValueOnce({ id: mockUserId2 } as any)
                .mockResolvedValueOnce({ id: mockUserId } as any);

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.createLoungeConnection(mockUserId, mockUserId2, mockLoungeSessionId);

            const firstCall = saveSpy.mock.calls[0][0] as Contact;
            expect(firstCall.acquiredVia).toBe(ACQUIRED_VIA.LOUNGE);
        });

        it('should throw BadRequestException if duplicate contacts detected', async () => {
            // Mock user lookups for linked_user_id validation (both create calls need to pass validation)
            mockUsersService.findOne
                .mockResolvedValueOnce({ id: mockUserId2 } as any)
                .mockResolvedValueOnce({ id: mockUserId } as any);

            const existingContact = { id: 'existing-123' } as Contact;
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(existingContact));

            await expect(
                service.createLoungeConnection(mockUserId, mockUserId2, mockLoungeSessionId),
            ).rejects.toThrow(BadRequestException);
        });
    });

    describe('importFromPhone (US-C9)', () => {
        const mockPhoneContactData: PhoneContactData = {
            name: 'John Doe',
            company_name: 'Acme Corp',
            title: 'Software Engineer',
            department: 'Engineering',
            notes: 'Met at conference',
            phone_numbers: [
                { number: '+1234567890', type: 'mobile' },
                { number: '+0987654321', type: 'work' },
            ],
            emails: [
                { email: 'john@example.com', type: 'work' },
                { email: 'johndoe@personal.com', type: 'personal' },
            ],
            addresses: [
                {
                    street: '123 Main St',
                    city: 'San Francisco',
                    state: 'CA',
                    postal_code: '94105',
                    country: 'USA',
                    type: 'work',
                },
            ],
        };

        it('should import phone contact with all data', async () => {
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            const result = await service.importFromPhone(mockUserId, mockPhoneContactData);

            expect(result).toBeDefined();
            expect(saveSpy).toHaveBeenCalled();

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.name).toBe('John Doe');
            expect(savedContact.companyName).toBe('Acme Corp');
            expect(savedContact.title).toBe('Software Engineer');
            expect(savedContact.acquiredVia).toBe(ACQUIRED_VIA.PHONE_IMPORT);
        });

        it('should map phone numbers correctly', async () => {
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.importFromPhone(mockUserId, mockPhoneContactData);

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.phoneNumbers).toBeDefined();
            expect(savedContact.phoneNumbers).toHaveLength(2);
            expect(savedContact.phoneNumbers?.[0].rawNumber).toBe('+1234567890');
            expect(savedContact.phoneNumbers?.[0].numberType).toBe('mobile');
        });

        it('should map emails correctly', async () => {
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.importFromPhone(mockUserId, mockPhoneContactData);

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.emails).toBeDefined();
            expect(savedContact.emails).toHaveLength(2);
            expect(savedContact.emails?.[0].email).toBe('john@example.com');
            expect(savedContact.emails?.[0].emailType).toBe('work');
        });

        it('should map addresses correctly', async () => {
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.importFromPhone(mockUserId, mockPhoneContactData);

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.addresses).toBeDefined();
            expect(savedContact.addresses).toHaveLength(1);
            expect(savedContact.addresses?.[0].streetName).toBe('123 Main St');
            expect(savedContact.addresses?.[0].city).toBe('San Francisco');
            expect(savedContact.addresses?.[0].rawAddress).toContain('123 Main St');
        });

        it('should import phone contact with minimal data', async () => {
            const minimalData: PhoneContactData = {
                name: 'Jane Smith',
            };

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            const result = await service.importFromPhone(mockUserId, minimalData);

            expect(result).toBeDefined();
            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.name).toBe('Jane Smith');
            expect(savedContact.acquiredVia).toBe(ACQUIRED_VIA.PHONE_IMPORT);
        });

        it('should default phone type to mobile if not specified', async () => {
            const dataWithoutType: PhoneContactData = {
                name: 'Test User',
                phone_numbers: [{ number: '+1234567890' }],
            };

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.importFromPhone(mockUserId, dataWithoutType);

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.phoneNumbers?.[0].numberType).toBe('mobile');
        });

        it('should default email type to personal if not specified', async () => {
            const dataWithoutType: PhoneContactData = {
                name: 'Test User',
                emails: [{ email: 'test@example.com' }],
            };

            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.importFromPhone(mockUserId, dataWithoutType);

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.emails?.[0].emailType).toBe('personal');
        });

        it('should detect duplicates for imported phone contacts', async () => {
            const existingContact = {
                id: 'existing-123',
                name: 'John Doe',
            } as Contact;
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(existingContact));

            const result = await service.importFromPhone(mockUserId, mockPhoneContactData);

            expect(result).toHaveProperty('duplicate', true);
            expect(result).toHaveProperty('existing_contact');
        });

        it('should store notes in meeting_notes field', async () => {
            mockContactRepo.findByHash = jest.fn(() => Promise.resolve(null));

            const saveSpy = jest.spyOn(mockContactRepo, 'save' as any);
            saveSpy.mockImplementation((contact) => Promise.resolve(contact as Contact));

            await service.importFromPhone(mockUserId, mockPhoneContactData);

            const savedContact = saveSpy.mock.calls[0][0] as Contact;
            expect(savedContact.meetingNotes).toBe('Met at conference');
        });
    });
});
