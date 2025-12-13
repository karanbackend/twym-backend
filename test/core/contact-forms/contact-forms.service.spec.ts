import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { ContactFormsService } from '../../../src/core/contact-forms/contact-forms.service';
import { ContactFormRepository } from '../../../src/core/contact-forms/contact-form.repository';
import { ContactSubmissionRepository } from '../../../src/core/contact-forms/contact-submission.repository';
import { ProfilesService } from '../../../src/core/profiles/profiles.service';
import { ContactsService } from '../../../src/core/contacts/contacts.service';
import {
    CONTACT_FORMS_CONFIG,
    CONTACT_FORMS_ERRORS,
} from '../../../src/core/contact-forms/contact-forms.constants';
import { ACQUIRED_VIA } from '../../../src/core/contacts/enums';
import type { ContactForm } from '../../../src/core/contact-forms/entities/contact-form.entity';
import type { ContactSubmission } from '../../../src/core/contact-forms/entities/contact-submission.entity';

describe('ContactFormsService', () => {
    let service: ContactFormsService;
    let contactFormRepo: jest.Mocked<ContactFormRepository>;
    let submissionRepo: jest.Mocked<ContactSubmissionRepository>;
    let profilesService: jest.Mocked<ProfilesService>;
    let contactsService: jest.Mocked<ContactsService>;

    const mockUserId = 'user-123';
    const mockProfileId = 'profile-123';
    const mockFormId = 'form-123';
    const mockSubmissionId = 'submission-123';
    const mockContactId = 'contact-123';

    const mockProfile = {
        id: mockProfileId,
        userId: mockUserId,
        name: 'Test User',
    };

    const mockForm: Partial<ContactForm> = {
        id: mockFormId,
        profileId: mockProfileId,
        formFields: [
            {
                name: 'name',
                type: 'text' as const,
                label: 'Name',
                required: true,
            },
            {
                name: 'email',
                type: 'email' as const,
                label: 'Email',
                required: true,
            },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const mockSubmission: Partial<ContactSubmission> = {
        id: mockSubmissionId,
        formId: mockFormId,
        profileId: mockProfileId,
        submissionData: {
            name: 'John Doe',
            email: 'john@example.com',
        },
        createdContactId: null,
        visitorIp: '127.0.0.1',
        isRead: false,
        expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const mockContactFormRepo: Partial<ContactFormRepository> = {
            create: jest.fn((data) => data as ContactForm),
            save: jest.fn((form) => Promise.resolve(form as ContactForm)),
            findOneById: jest.fn(),
            findOneByProfileId: jest.fn(),
            remove: jest.fn(),
        };

        const mockSubmissionRepo: Partial<ContactSubmissionRepository> = {
            create: jest.fn((data) => data as ContactSubmission),
            save: jest.fn((submission) => Promise.resolve(submission as ContactSubmission)),
            findOneById: jest.fn(),
            findByProfileId: jest.fn(),
            findUnreadByProfileId: jest.fn(),
            countUnreadByProfileId: jest.fn(),
            countSubmissionsByIpToday: jest.fn(),
            findExpiredSubmissions: jest.fn(),
            removeMany: jest.fn(),
        };

        const mockProfilesService: Partial<ProfilesService> = {
            findByUserId: jest.fn(),
            findOne: jest.fn(),
        };

        const mockContactsService: Partial<ContactsService> = {
            create: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactFormsService,
                {
                    provide: ContactFormRepository,
                    useValue: mockContactFormRepo,
                },
                {
                    provide: ContactSubmissionRepository,
                    useValue: mockSubmissionRepo,
                },
                { provide: ProfilesService, useValue: mockProfilesService },
                { provide: ContactsService, useValue: mockContactsService },
            ],
        }).compile();

        service = module.get<ContactFormsService>(ContactFormsService);
        contactFormRepo = module.get(ContactFormRepository);
        submissionRepo = module.get(ContactSubmissionRepository);
        profilesService = module.get(ProfilesService);
        contactsService = module.get(ContactsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createForm', () => {
        it('should create a new form when none exists', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            contactFormRepo.findOneByProfileId.mockResolvedValue(null);
            contactFormRepo.save.mockResolvedValue(mockForm as ContactForm);

            const createDto = {
                name: 'Your Name',
                email: 'Email',
                phone: 'Phone',
                jobTitle: 'Job Title',
                company: 'Company',
                message: 'Message',
                isActive: true,
            };

            const result = await service.createForm(mockUserId, createDto);

            expect(profilesService.findByUserId).toHaveBeenCalledWith(mockUserId);
            expect(contactFormRepo.findOneByProfileId).toHaveBeenCalledWith(mockProfileId);
            expect(contactFormRepo.create).toHaveBeenCalled();
            expect(contactFormRepo.save).toHaveBeenCalled();
            expect(result.id).toBe(mockFormId);
        });

        it('should throw NotFoundException when profile not found', async () => {
            profilesService.findByUserId.mockResolvedValue(null);

            const badDto = {} as any;

            await expect(service.createForm(mockUserId, badDto)).rejects.toThrow(
                new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND),
            );
        });
    });

    describe('updateForm', () => {
        it('should update existing form', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile);
            contactFormRepo.findOneByProfileId.mockResolvedValue(mockForm as ContactForm);
            contactFormRepo.save.mockResolvedValue(mockForm as ContactForm);

            const updateDto = {
                formFields: [
                    {
                        name: 'name',
                        type: 'text' as const,
                        label: 'Full Name',
                        required: true,
                    },
                ],
                isActive: false,
            };

            const result = await service.updateForm(mockUserId, updateDto as any);

            expect(contactFormRepo.save).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        it('should throw NotFoundException when profile not found', async () => {
            profilesService.findByUserId.mockResolvedValue(null as any);

            const updateDto = {
                formFields: mockForm.formFields!,
            };

            await expect(service.updateForm(mockUserId, updateDto as any)).rejects.toThrow(
                new NotFoundException(CONTACT_FORMS_ERRORS.PROFILE_NOT_FOUND),
            );
        });
    });

    describe('getFormByUserId', () => {
        it('should return form for user', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            contactFormRepo.findOneByProfileId.mockResolvedValue(mockForm as ContactForm);

            const result = await service.getFormByUserId(mockUserId);

            expect(result.id).toBe(mockFormId);
            expect(result.profileId).toBe(mockProfileId);
        });

        it('should throw NotFoundException when profile not found', async () => {
            profilesService.findByUserId.mockResolvedValue(null as any);

            await expect(service.getFormByUserId(mockUserId)).rejects.toThrow(NotFoundException);
        });

        it('should throw NotFoundException when form not found', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            contactFormRepo.findOneByProfileId.mockResolvedValue(null);

            await expect(service.getFormByUserId(mockUserId)).rejects.toThrow(
                new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND),
            );
        });
    });

    describe('submitForm', () => {
        it('should successfully submit form', async () => {
            const activeForm = { ...mockForm, isActive: true };
            contactFormRepo.findOneByProfileId.mockResolvedValue(activeForm as ContactForm);
            profilesService.findOne.mockResolvedValue({
                ...mockProfile,
                contact_capture_enabled: true,
            } as any);
            submissionRepo.countSubmissionsByIpToday.mockResolvedValue(0);
            submissionRepo.save.mockResolvedValue(mockSubmission as ContactSubmission);

            const submitDto = {
                submissionData: { name: 'John Doe', email: 'john@example.com' },
                visitorIp: '127.0.0.1',
            };

            const result = await service.submitForm(mockProfileId, submitDto);

            expect(result.id).toBe(mockSubmissionId);
            expect(submissionRepo.save).toHaveBeenCalled();
        });

        it('should throw NotFoundException when form not found', async () => {
            contactFormRepo.findOneByProfileId.mockResolvedValue(null);

            const submitDto = {
                submissionData: { name: 'John Doe', email: 'john@example.com' },
            };

            await expect(service.submitForm(mockProfileId, submitDto)).rejects.toThrow(
                new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND),
            );
        });

        it('should throw BadRequestException when form is inactive', async () => {
            contactFormRepo.findOneByProfileId.mockResolvedValue({
                ...mockForm,
                isActive: false,
            } as ContactForm);
            profilesService.findOne.mockResolvedValue({
                ...mockProfile,
                contact_capture_enabled: true,
            } as any);

            const submitDto = {
                submissionData: { name: 'John Doe', email: 'john@example.com' },
            };

            await expect(service.submitForm(mockProfileId, submitDto)).rejects.toThrow(
                new BadRequestException(CONTACT_FORMS_ERRORS.FORM_INACTIVE),
            );
        });

        it('should enforce rate limiting', async () => {
            const activeForm = { ...mockForm, isActive: true };
            contactFormRepo.findOneByProfileId.mockResolvedValue(activeForm as ContactForm);
            profilesService.findOne.mockResolvedValue({
                ...mockProfile,
                contact_capture_enabled: true,
            } as any);
            submissionRepo.countSubmissionsByIpToday.mockResolvedValue(
                CONTACT_FORMS_CONFIG.RATE_LIMIT.MAX_SUBMISSIONS_PER_DAY,
            );

            const submitDto = {
                submissionData: { name: 'John Doe', email: 'john@example.com' },
                visitorIp: '127.0.0.1',
            };

            await expect(service.submitForm(mockProfileId, submitDto)).rejects.toThrow(
                new BadRequestException(CONTACT_FORMS_ERRORS.RATE_LIMIT_EXCEEDED),
            );
        });

        it('should validate required fields', async () => {
            const activeForm: Partial<ContactForm> = {
                ...mockForm,
                isActive: true,
                formFields: [
                    {
                        name: 'name',
                        type: 'text' as const,
                        label: 'Name',
                        required: true,
                    },
                    {
                        name: 'email',
                        type: 'email' as const,
                        label: 'Email',
                        required: true,
                    },
                ],
            };
            contactFormRepo.findOneByProfileId.mockResolvedValue(activeForm as ContactForm);
            profilesService.findOne.mockResolvedValue({
                ...mockProfile,
                contact_capture_enabled: true,
            } as any);
            submissionRepo.countSubmissionsByIpToday.mockResolvedValue(0);

            const submitDto = {
                submissionData: { name: 'John Doe' }, // Missing required email
            };

            await expect(service.submitForm(mockProfileId, submitDto)).rejects.toThrow(
                BadRequestException,
            );
        });

        it('should validate email format', async () => {
            const activeForm: Partial<ContactForm> = {
                ...mockForm,
                isActive: true,
                formFields: [
                    {
                        name: 'name',
                        type: 'text' as const,
                        label: 'Name',
                        required: true,
                    },
                    {
                        name: 'email',
                        type: 'email' as const,
                        label: 'Email',
                        required: true,
                    },
                ],
            };
            contactFormRepo.findOneByProfileId.mockResolvedValue(activeForm as ContactForm);
            profilesService.findOne.mockResolvedValue({
                ...mockProfile,
                contact_capture_enabled: true,
            } as any);
            submissionRepo.countSubmissionsByIpToday.mockResolvedValue(0);

            const submitDto = {
                submissionData: { name: 'John Doe', email: 'invalid-email' },
            };

            await expect(service.submitForm(mockProfileId, submitDto)).rejects.toThrow(
                BadRequestException,
            );
        });
    });

    describe('getSubmissions', () => {
        it('should return all submissions for user', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findByProfileId.mockResolvedValue([mockSubmission as ContactSubmission]);

            const result = await service.getSubmissions(mockUserId, false);

            expect(result).toHaveLength(1);
            expect(result[0].id).toBe(mockSubmissionId);
        });

        it('should return only unread submissions when requested', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findUnreadByProfileId.mockResolvedValue([
                mockSubmission as ContactSubmission,
            ]);

            const result = await service.getSubmissions(mockUserId, true);

            expect(submissionRepo.findUnreadByProfileId).toHaveBeenCalledWith(mockProfileId);
            expect(result).toHaveLength(1);
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.countUnreadByProfileId.mockResolvedValue(5);

            const result = await service.getUnreadCount(mockUserId);

            expect(result).toBe(5);
        });
    });

    describe('markSubmissionAsRead', () => {
        it('should mark submission as read', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue(mockSubmission as ContactSubmission);
            submissionRepo.save.mockResolvedValue({
                ...mockSubmission,
                isRead: true,
            } as ContactSubmission);

            const result = await service.markSubmissionAsRead(mockUserId, mockSubmissionId, {
                isRead: true,
            });

            expect(result.isRead).toBe(true);
        });

        it('should throw NotFoundException when submission not found', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue(null);

            await expect(
                service.markSubmissionAsRead(mockUserId, mockSubmissionId, {
                    isRead: true,
                }),
            ).rejects.toThrow(new NotFoundException(CONTACT_FORMS_ERRORS.SUBMISSION_NOT_FOUND));
        });

        it('should prevent access to other users submissions', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue({
                ...mockSubmission,
                profileId: 'different-profile-id',
            } as ContactSubmission);

            await expect(
                service.markSubmissionAsRead(mockUserId, mockSubmissionId, {
                    isRead: true,
                }),
            ).rejects.toThrow(NotFoundException);
        });
    });

    describe('addSubmissionToContacts', () => {
        it('should successfully convert submission to contact', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue(mockSubmission as ContactSubmission);
            contactsService.create.mockResolvedValue({
                id: mockContactId,
                name: 'John Doe',
            } as any);
            submissionRepo.save.mockResolvedValue({
                ...mockSubmission,
                createdContactId: mockContactId,
                isRead: true,
            } as ContactSubmission);

            const result = await service.addSubmissionToContacts(mockUserId, mockSubmissionId);

            expect(contactsService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    acquired_via: ACQUIRED_VIA.CONTACT_CAPTURE_FORM,
                    automatic_tags: ['Lead'],
                }),
                mockUserId,
            );
            expect(result.id).toBe(mockContactId);
        });

        it('should throw ConflictException when already converted', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue({
                ...mockSubmission,
                createdContactId: mockContactId,
            } as ContactSubmission);

            await expect(
                service.addSubmissionToContacts(mockUserId, mockSubmissionId),
            ).rejects.toThrow(new ConflictException(CONTACT_FORMS_ERRORS.ALREADY_CONVERTED));
        });

        it('should throw ConflictException when contact already exists', async () => {
            const freshSubmission = {
                ...mockSubmission,
                createdContactId: null,
            };
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue(freshSubmission as ContactSubmission);
            contactsService.create.mockResolvedValue({
                duplicate: true,
                existing_contact: { id: mockContactId },
            } as any);

            await expect(
                service.addSubmissionToContacts(mockUserId, mockSubmissionId),
            ).rejects.toThrow(new ConflictException(CONTACT_FORMS_ERRORS.CONTACT_EXISTS));
        });

        it('should map submission data correctly to contact', async () => {
            const fullSubmission = {
                ...mockSubmission,
                createdContactId: null,
                submissionData: {
                    name: 'John Doe',
                    email: 'john@example.com',
                    phone: '+1234567890',
                    company: 'Acme Corp',
                    message: 'I am interested',
                },
            };

            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            submissionRepo.findOneById.mockResolvedValue(fullSubmission as ContactSubmission);
            contactsService.create.mockResolvedValue({
                id: mockContactId,
            } as any);
            submissionRepo.save.mockResolvedValue(fullSubmission as ContactSubmission);

            await service.addSubmissionToContacts(mockUserId, mockSubmissionId);

            expect(contactsService.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    name: 'John Doe',
                    company_name: 'Acme Corp',
                    meeting_notes: 'I am interested',
                    emails: expect.arrayContaining([
                        expect.objectContaining({
                            email: 'john@example.com',
                        }),
                    ]),
                    phone_numbers: expect.arrayContaining([
                        expect.objectContaining({
                            raw_number: '+1234567890',
                        }),
                    ]),
                }),
                mockUserId,
            );
        });
    });

    describe('deleteForm', () => {
        it('should delete form successfully', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            contactFormRepo.findOneByProfileId.mockResolvedValue(mockForm as ContactForm);

            await service.deleteForm(mockUserId);

            expect(contactFormRepo.remove).toHaveBeenCalledWith(mockForm);
        });

        it('should throw NotFoundException when form not found', async () => {
            profilesService.findByUserId.mockResolvedValue(mockProfile as any);
            contactFormRepo.findOneByProfileId.mockResolvedValue(null);

            await expect(service.deleteForm(mockUserId)).rejects.toThrow(
                new NotFoundException(CONTACT_FORMS_ERRORS.FORM_NOT_FOUND),
            );
        });
    });

    describe('cleanupExpiredSubmissions', () => {
        it('should clean up expired submissions', async () => {
            const expiredSubmissions = [
                { ...mockSubmission, id: 'expired-1' },
                { ...mockSubmission, id: 'expired-2' },
            ] as ContactSubmission[];

            submissionRepo.findExpiredSubmissions.mockResolvedValue(expiredSubmissions);

            await service.cleanupExpiredSubmissions();

            expect(submissionRepo.findExpiredSubmissions).toHaveBeenCalled();
            expect(submissionRepo.removeMany).toHaveBeenCalledWith(expiredSubmissions);
        });

        it('should handle no expired submissions gracefully', async () => {
            submissionRepo.findExpiredSubmissions.mockResolvedValue([]);

            await service.cleanupExpiredSubmissions();

            expect(submissionRepo.removeMany).not.toHaveBeenCalled();
        });

        it('should handle cleanup errors gracefully', async () => {
            submissionRepo.findExpiredSubmissions.mockRejectedValue(new Error('Database error'));

            // Mock logger to suppress error logs
            const loggerErrorSpy = jest
                .spyOn((service as any).logger, 'error')
                .mockImplementation();

            // Should not throw
            await expect(service.cleanupExpiredSubmissions()).resolves.not.toThrow();

            loggerErrorSpy.mockRestore();
        });
    });
});
