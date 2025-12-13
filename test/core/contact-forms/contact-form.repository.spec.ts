import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ContactFormRepository } from '../../../src/core/contact-forms/contact-form.repository';
import { ContactForm } from '../../../src/core/contact-forms/entities/contact-form.entity';

describe('ContactFormRepository', () => {
    let repository: ContactFormRepository;
    let mockRepository: jest.Mocked<Repository<ContactForm>>;

    const mockForm: Partial<ContactForm> = {
        id: 'form-123',
        profileId: 'profile-123',
        formFields: [
            { name: 'name', type: 'text', label: 'Name', required: true },
            { name: 'email', type: 'email', label: 'Email', required: true },
        ],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        mockRepository = {
            create: jest.fn((data) => data as ContactForm),
            save: jest.fn((form) => Promise.resolve(form as ContactForm)),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactFormRepository,
                {
                    provide: getRepositoryToken(ContactForm),
                    useValue: mockRepository,
                },
            ],
        }).compile();

        repository = module.get<ContactFormRepository>(ContactFormRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('create', () => {
        it('should create a form entity', () => {
            const data = {
                profileId: 'profile-123',
                formFields: mockForm.formFields!,
                isActive: true,
            };

            const result = repository.create(data);

            expect(mockRepository.create).toHaveBeenCalledWith(data);
            expect(result).toBeDefined();
        });
    });

    describe('save', () => {
        it('should save a form', async () => {
            mockRepository.save.mockResolvedValue(mockForm as ContactForm);

            const result = await repository.save(mockForm as ContactForm);

            expect(mockRepository.save).toHaveBeenCalledWith(mockForm);
            expect(result).toEqual(mockForm);
        });
    });

    describe('findOneById', () => {
        it('should find form by id', async () => {
            mockRepository.findOne.mockResolvedValue(mockForm as ContactForm);

            const result = await repository.findOneById('form-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { id: 'form-123' },
            });
            expect(result).toEqual(mockForm);
        });

        it('should return null when form not found', async () => {
            mockRepository.findOne.mockResolvedValue(null);

            const result = await repository.findOneById('non-existent');

            expect(result).toBeNull();
        });
    });

    describe('findOneByProfileId', () => {
        it('should find form by profile id', async () => {
            mockRepository.findOne.mockResolvedValue(mockForm as ContactForm);

            const result = await repository.findOneByProfileId('profile-123');

            expect(mockRepository.findOne).toHaveBeenCalledWith({
                where: { profileId: 'profile-123' },
            });
            expect(result).toEqual(mockForm);
        });
    });

    describe('findAll', () => {
        it('should find all forms', async () => {
            mockRepository.find.mockResolvedValue([mockForm as ContactForm]);

            const result = await repository.findAll();

            expect(mockRepository.find).toHaveBeenCalledWith({
                order: { createdAt: 'DESC' },
            });
            expect(result).toHaveLength(1);
        });
    });

    describe('remove', () => {
        it('should remove a form', async () => {
            await repository.remove(mockForm as ContactForm);

            expect(mockRepository.remove).toHaveBeenCalledWith(mockForm);
        });
    });
});
