import { Test, TestingModule } from '@nestjs/testing';
import { ContactFormsController } from '../../../src/core/contact-forms/contact-forms.controller';
import { ContactFormsService } from '../../../src/core/contact-forms/contact-forms.service';
import type { AuthUser } from '../../../src/common/decorators/current-auth-user.decorator';

describe('ContactFormsController', () => {
    let controller: ContactFormsController;
    let service: jest.Mocked<ContactFormsService>;

    const mockUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
    };

    const mockFormId = 'form-123';
    const mockProfileId = 'profile-123';
    const mockSubmissionId = 'submission-123';

    const mockFormResponse = {
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

    const mockSubmissionResponse = {
        id: mockSubmissionId,
        formId: mockFormId,
        profileId: mockProfileId,
        submissionData: {
            name: 'John Doe',
            email: 'john@example.com',
        },
        createdContactId: null,
        visitorIp: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        referrer: null,
        captchaVerified: false,
        isRead: false,
        expiresAt: new Date(),
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const mockService: Partial<ContactFormsService> = {
            createForm: jest.fn(),
            getFormByUserId: jest.fn(),
            getFormByProfileId: jest.fn(),
            updateForm: jest.fn(),
            deleteForm: jest.fn(),
            submitForm: jest.fn(),
            getSubmissions: jest.fn(),
            getSubmissionById: jest.fn(),
            getUnreadCount: jest.fn(),
            markSubmissionAsRead: jest.fn(),
            addSubmissionToContacts: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContactFormsController],
            providers: [{ provide: ContactFormsService, useValue: mockService }],
        }).compile();

        controller = module.get<ContactFormsController>(ContactFormsController);
        service = module.get(ContactFormsService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('createForm', () => {
        it('should create a form', async () => {
            const dto = {
                name: 'Your Name',
                email: 'Email',
                phone: 'Phone',
                jobTitle: 'Job Title',
                company: 'Company',
                message: 'Message',
                isActive: true,
            };

            service.createForm.mockResolvedValue(mockFormResponse);

            const result = await controller.createForm(mockUser, dto);

            expect(service.createForm).toHaveBeenCalledWith(mockUser.id, dto);
            expect(result).toEqual(mockFormResponse);
        });
    });

    describe('getMyForm', () => {
        it('should return user form', async () => {
            service.getFormByUserId.mockResolvedValue(mockFormResponse);

            const result = await controller.getMyForm(mockUser);

            expect(service.getFormByUserId).toHaveBeenCalledWith(mockUser.id);
            expect(result).toEqual(mockFormResponse);
        });
    });

    describe('updateMyForm', () => {
        it('should update user form', async () => {
            const dto = {
                isActive: false,
            };

            service.updateForm.mockResolvedValue({
                ...mockFormResponse,
                isActive: false,
            });

            const result = await controller.updateMyForm(mockUser, dto);

            expect(service.updateForm).toHaveBeenCalledWith(mockUser.id, dto);
            expect(result.isActive).toBe(false);
        });
    });

    describe('deleteMyForm', () => {
        it('should delete user form', async () => {
            service.deleteForm.mockResolvedValue(undefined);

            await controller.deleteMyForm(mockUser);

            expect(service.deleteForm).toHaveBeenCalledWith(mockUser.id);
        });
    });

    describe('submitForm', () => {
        it('should submit form with visitor metadata', async () => {
            const dto = {
                submissionData: {
                    name: 'John Doe',
                    email: 'john@example.com',
                },
            };

            const ip = '192.168.1.1';
            const userAgent = 'Mozilla/5.0';
            const referrer = 'https://google.com';

            service.submitForm.mockResolvedValue(mockSubmissionResponse);

            const result = await controller.submitForm(mockProfileId, dto, ip, userAgent, referrer);

            expect(service.submitForm).toHaveBeenCalledWith(mockProfileId, {
                ...dto,
                visitorIp: ip,
                userAgent,
                referrer,
            });
            expect(result).toEqual(mockSubmissionResponse);
        });

        it('should handle missing optional metadata', async () => {
            const dto = {
                submissionData: {
                    name: 'John Doe',
                    email: 'john@example.com',
                },
            };

            const ip = '192.168.1.1';

            service.submitForm.mockResolvedValue(mockSubmissionResponse);

            await controller.submitForm(mockProfileId, dto, ip);

            expect(service.submitForm).toHaveBeenCalledWith(mockProfileId, {
                ...dto,
                visitorIp: ip,
                userAgent: undefined,
                referrer: undefined,
            });
        });
    });

    describe('getPublicForm', () => {
        it('should return public form structure', async () => {
            service.getFormByProfileId.mockResolvedValue(mockFormResponse);

            const result = await controller.getPublicForm(mockProfileId);

            expect(service.getFormByProfileId).toHaveBeenCalledWith(mockProfileId);
            expect(result).toEqual(mockFormResponse);
        });
    });

    describe('getSubmissions', () => {
        it('should return all submissions', async () => {
            service.getSubmissions.mockResolvedValue([mockSubmissionResponse]);

            const result = await controller.getSubmissions(mockUser);

            expect(service.getSubmissions).toHaveBeenCalledWith(mockUser.id, false);
            expect(result).toHaveLength(1);
        });

        it('should return only unread submissions when requested', async () => {
            service.getSubmissions.mockResolvedValue([mockSubmissionResponse]);

            const result = await controller.getSubmissions(mockUser, 'true');

            expect(service.getSubmissions).toHaveBeenCalledWith(mockUser.id, true);
            expect(result).toHaveLength(1);
        });
    });

    describe('getUnreadCount', () => {
        it('should return unread count', async () => {
            service.getUnreadCount.mockResolvedValue(5);

            const result = await controller.getUnreadCount(mockUser);

            expect(service.getUnreadCount).toHaveBeenCalledWith(mockUser.id);
            expect(result).toEqual({ count: 5 });
        });
    });

    describe('getSubmissionById', () => {
        it('should return specific submission', async () => {
            service.getSubmissionById.mockResolvedValue(mockSubmissionResponse);

            const result = await controller.getSubmissionById(mockUser, mockSubmissionId);

            expect(service.getSubmissionById).toHaveBeenCalledWith(mockUser.id, mockSubmissionId);
            expect(result).toEqual(mockSubmissionResponse);
        });
    });

    describe('markAsRead', () => {
        it('should mark submission as read', async () => {
            const dto = { isRead: true };

            service.markSubmissionAsRead.mockResolvedValue({
                ...mockSubmissionResponse,
                isRead: true,
            });

            const result = await controller.markAsRead(mockUser, mockSubmissionId, dto);

            expect(service.markSubmissionAsRead).toHaveBeenCalledWith(
                mockUser.id,
                mockSubmissionId,
                dto,
            );
            expect(result.isRead).toBe(true);
        });
    });

    describe('addToContacts', () => {
        it('should add submission to contacts', async () => {
            const mockContact = {
                id: 'contact-123',
                name: 'John Doe',
            };

            service.addSubmissionToContacts.mockResolvedValue(mockContact);

            const result = await controller.addToContacts(mockUser, mockSubmissionId);

            expect(service.addSubmissionToContacts).toHaveBeenCalledWith(
                mockUser.id,
                mockSubmissionId,
            );
            expect(result).toEqual(mockContact);
        });
    });
});
