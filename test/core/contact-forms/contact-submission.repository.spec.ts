import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ContactSubmissionRepository } from '../../../src/core/contact-forms/contact-submission.repository';
import { ContactSubmission } from '../../../src/core/contact-forms/entities/contact-submission.entity';

describe('ContactSubmissionRepository', () => {
    let repository: ContactSubmissionRepository;
    let mockRepository: jest.Mocked<Repository<ContactSubmission>>;
    let mockQueryBuilder: jest.Mocked<SelectQueryBuilder<ContactSubmission>>;

    const mockSubmission: Partial<ContactSubmission> = {
        id: 'submission-123',
        formId: 'form-123',
        profileId: 'profile-123',
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
        mockQueryBuilder = {
            where: jest.fn().mockReturnThis(),
            andWhere: jest.fn().mockReturnThis(),
            getCount: jest.fn(),
            getMany: jest.fn(),
        } as any;

        mockRepository = {
            create: jest.fn((data) => data as ContactSubmission),
            save: jest.fn((submission) => Promise.resolve(submission as ContactSubmission)),
            find: jest.fn(),
            findOne: jest.fn(),
            count: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn(() => mockQueryBuilder),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactSubmissionRepository,
                {
                    provide: getRepositoryToken(ContactSubmission),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        repository = module.get<ContactSubmissionRepository>(ContactSubmissionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a submission entity', () => {
            const data = {
                formId: 'form-123',
                profileId: 'profile-123',
                submissionData: { name: 'John', email: 'john@test.com' },
            };

            const result = repository.create(data);

            expect(mockRepository.create).toHaveBeenCalledWith(data);
            expect(result).toBeDefined();
        });
    });

    describe('save', () => {
        it('should save a submission', async () => {
            mockRepository.save.mockResolvedValue(mockSubmission as ContactSubmission);

            const result = await repository.save(mockSubmission as ContactSubmission);

            expect(mockRepository.save).toHaveBeenCalledWith(mockSubmission);
            expect(result).toEqual(mockSubmission);
        });
    });

    describe('findOneById', () => {
        it('should find submission by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockSubmission as ContactSubmission);

            const result = await repository.findOneById('submission-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'submission-123' },
            });
            expect(result).toEqual(mockSubmission);
        });
    });

    describe('findByProfileId', () => {
        it('should find submissions by profile id', async () => {
            mockRepository.find.mockResolvedValue([mockSubmission as ContactSubmission]);

            const result = await repository.findByProfileId('profile-123');

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { profileId: 'profile-123' },
                order: { createdAt: 'DESC' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('findUnreadByProfileId', () => {
        it('should find unread submissions', async () => {
            mockRepository.find.mockResolvedValue([mockSubmission as ContactSubmission]);

            const result = await repository.findUnreadByProfileId('profile-123');

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { profileId: 'profile-123', isRead: false },
                order: { createdAt: 'DESC' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('countUnreadByProfileId', () => {
        it('should count unread submissions', async () => {
            mockRepository.count.mockResolvedValue(5);

            const result = await repository.countUnreadByProfileId('profile-123');

            expect(mockRepository.count).toHaveBeenCalledWith({
                where: { profileId: 'profile-123', isRead: false },
            });
            expect(result).toBe(5);
        });
    });

    describe('findByFormId', () => {
        it('should find submissions by form id', async () => {
            mockRepository.find.mockResolvedValue([mockSubmission as ContactSubmission]);

            const result = await repository.findByFormId('form-123');

            expect(mockRepository.find).toHaveBeenCalledWith({
                where: { formId: 'form-123' },
                order: { createdAt: 'DESC' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('countSubmissionsByIpToday', () => {
        it('should count submissions by IP for today', async () => {
            mockQueryBuilder.getCount.mockResolvedValue(3);

            const result = await repository.countSubmissionsByIpToday('127.0.0.1');

            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('submission');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('submission.visitor_ip = :ip', {
                ip: '127.0.0.1',
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'submission.created_at >= :today',
                expect.objectContaining({ today: expect.any(Date) }),
            );
            expect(result).toBe(3);
        });
    });

    describe('findExpiredSubmissions', () => {
        it('should find expired submissions', async () => {
            const expiredSubmissions = [
                { ...mockSubmission, id: 'expired-1' },
            ] as ContactSubmission[];

            mockQueryBuilder.getMany.mockResolvedValue(expiredSubmissions);

            const result = await repository.findExpiredSubmissions();

            expect(mockRepository.createQueryBuilder).toHaveBeenCalledWith('submission');
            expect(mockQueryBuilder.where).toHaveBeenCalledWith(
                'submission.expires_at < :now',
                expect.objectContaining({ now: expect.any(Date) }),
            );
            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'submission.expires_at IS NOT NULL',
            );
            expect(result).toEqual(expiredSubmissions);
        });
    });

    describe('remove', () => {
        it('should remove a submission', async () => {
            await repository.remove(mockSubmission as ContactSubmission);

            expect(mockRepository.remove).toHaveBeenCalledWith(mockSubmission);
        });
    });

    describe('removeMany', () => {
        it('should remove multiple submissions', async () => {
            const submissions = [
                { ...mockSubmission, id: 'sub-1' },
                { ...mockSubmission, id: 'sub-2' },
            ] as ContactSubmission[];

            await repository.removeMany(submissions);

            expect(mockRepository.remove).toHaveBeenCalledWith(submissions);
        });
    });
});
