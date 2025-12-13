import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { ContactRepository } from '../../../src/core/contacts/contact.repository';
import { Contact } from '../../../src/core/contacts/entities/contact.entity';

describe('ContactRepository', () => {
    let repository: ContactRepository;
    let mockTypeOrmRepo: jest.Mocked<Repository<Contact>>;

    const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        addOrderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn(),
    };

    beforeEach(async () => {
        mockTypeOrmRepo = {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue(mockQueryBuilder),
            softDelete: jest.fn(),
            restore: jest.fn(),
        } as any;

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactRepository,
                {
                    provide: getRepositoryToken(Contact),
                    useValue: mockTypeOrmRepo,
                },
            ],
        }).compile();

        repository = module.get<ContactRepository>(ContactRepository);
    });

    it('should be defined', () => {
        expect(repository).toBeDefined();
    });

    describe('create', () => {
        it('should create a contact entity', () => {
            const data = { name: 'John Doe', ownerId: 'user-123' };
            const mockContact = { id: 'contact-1', ...data } as Contact;

            mockTypeOrmRepo.create.mockReturnValue(mockContact as any);

            const result = repository.create(data);

            expect(result).toEqual(mockContact);
            expect(mockTypeOrmRepo.create).toHaveBeenCalledWith(data);
        });
    });

    describe('save', () => {
        it('should save a contact entity', async () => {
            const mockContact = {
                id: 'contact-1',
                name: 'John Doe',
            } as Contact;

            mockTypeOrmRepo.save.mockResolvedValue(mockContact as any);

            const result = await repository.save(mockContact);

            expect(result).toEqual(mockContact);
            expect(mockTypeOrmRepo.save).toHaveBeenCalledWith(mockContact);
        });
    });

    describe('findAll', () => {
        it('should find all contacts with relations', async () => {
            const mockContacts = [
                { id: '1', name: 'Contact 1' },
                { id: '2', name: 'Contact 2' },
            ] as Contact[];

            mockTypeOrmRepo.find.mockResolvedValue(mockContacts);

            const result = await repository.findAll();

            expect(result).toEqual(mockContacts);
            expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
                relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
            });
        });
    });

    describe('findOneById', () => {
        it('should find a contact by id with relations', async () => {
            const mockContact = {
                id: 'contact-1',
                name: 'John Doe',
            } as Contact;

            mockTypeOrmRepo.findOne.mockResolvedValue(mockContact);

            const result = await repository.findOneById('contact-1');

            expect(result).toEqual(mockContact);
            expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { id: 'contact-1' },
                relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
            });
        });

        it('should return null if contact not found', async () => {
            mockTypeOrmRepo.findOne.mockResolvedValue(null);

            const result = await repository.findOneById('nonexistent');

            expect(result).toBeNull();
        });
    });

    describe('findByOwnerId', () => {
        it('should find all contacts for an owner', async () => {
            const ownerId = 'user-123';
            const mockContacts = [
                { id: '1', name: 'Contact 1', ownerId },
                { id: '2', name: 'Contact 2', ownerId },
            ] as Contact[];

            mockTypeOrmRepo.find.mockResolvedValue(mockContacts);

            const result = await repository.findByOwnerId(ownerId);

            expect(result).toEqual(mockContacts);
            expect(mockTypeOrmRepo.find).toHaveBeenCalledWith({
                where: { ownerId, deletedAt: IsNull() },
                relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
                order: { createdAt: 'DESC' },
            });
        });
    });

    describe('findByHash', () => {
        it('should find a contact by hash for an owner', async () => {
            const ownerId = 'user-123';
            const contactHash = 'hash-abc123';
            const mockContact = {
                id: 'contact-1',
                ownerId,
                contactHash,
            } as Contact;

            mockTypeOrmRepo.findOne.mockResolvedValue(mockContact);

            const result = await repository.findByHash(ownerId, contactHash);

            expect(result).toEqual(mockContact);
            expect(mockTypeOrmRepo.findOne).toHaveBeenCalledWith({
                where: { ownerId, contactHash, deletedAt: IsNull() },
                relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
            });
        });

        it('should return null if no matching contact found', async () => {
            mockTypeOrmRepo.findOne.mockResolvedValue(null);

            const result = await repository.findByHash('user-123', 'nonexistent-hash');

            expect(result).toBeNull();
        });
    });

    describe('searchContacts', () => {
        beforeEach(() => {
            jest.clearAllMocks();
        });

        it('should search contacts with query string', async () => {
            const ownerId = 'user-123';
            const query = 'john';
            const mockContacts = [{ id: '1', name: 'John Doe' }] as Contact[];

            mockQueryBuilder.getMany.mockResolvedValue(mockContacts);

            const result = await repository.searchContacts(ownerId, query);

            expect(result).toEqual(mockContacts);
            expect(mockQueryBuilder.where).toHaveBeenCalledWith('contact.owner_id = :ownerId', {
                ownerId,
            });
            expect(mockQueryBuilder.andWhere).toHaveBeenCalled();
        });

        it('should search contacts with tag filter', async () => {
            const ownerId = 'user-123';
            const query = '';
            const options = { filterByTag: 'vip' };
            const mockContacts = [] as Contact[];

            mockQueryBuilder.getMany.mockResolvedValue(mockContacts);

            await repository.searchContacts(ownerId, query, options);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                expect.stringContaining('tag'),
                expect.objectContaining({ tag: 'vip' }),
            );
        });

        it('should search contacts with event filter', async () => {
            const ownerId = 'user-123';
            const query = '';
            const options = { filterByEvent: 'event-123' };
            const mockContacts = [] as Contact[];

            mockQueryBuilder.getMany.mockResolvedValue(mockContacts);

            await repository.searchContacts(ownerId, query, options);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('contact.event_id = :eventId', {
                eventId: 'event-123',
            });
        });

        it('should search contacts with acquired_via filter', async () => {
            const ownerId = 'user-123';
            const query = '';
            const options = { filterByAcquiredVia: 'manual' };
            const mockContacts = [] as Contact[];

            mockQueryBuilder.getMany.mockResolvedValue(mockContacts);

            await repository.searchContacts(ownerId, query, options);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
                'contact.acquired_via = :acquiredVia',
                { acquiredVia: 'manual' },
            );
        });

        it('should handle multiple filters', async () => {
            const ownerId = 'user-123';
            const query = 'john';
            const options = {
                filterByTag: 'vip',
                filterByEvent: 'event-123',
                sortBy: 'name',
                isPinned: true,
                isFavorite: true,
            };
            const mockContacts = [] as Contact[];

            mockQueryBuilder.getMany.mockResolvedValue(mockContacts);

            await repository.searchContacts(ownerId, query, options);

            expect(mockQueryBuilder.andWhere).toHaveBeenCalledTimes(6); // query + filters (owner + query + 4 filters)
        });
    });
});
