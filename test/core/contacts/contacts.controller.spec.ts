import { Test, TestingModule } from '@nestjs/testing';
import { ContactsController } from '../../../src/core/contacts/contacts.controller';
import { ContactsService } from '../../../src/core/contacts/contacts.service';
import { CreateContactDto } from '../../../src/core/contacts/dto/create-contact.dto';
import { UpdateContactDto } from '../../../src/core/contacts/dto/update-contact.dto';
import { CreateScannedContactDto } from '../../../src/core/contacts/dto/create-scanned-contact.dto';
import { UploadBusinessCardDto } from '../../../src/core/contacts/dto/business-card.dto';
import { AuthUser } from '../../../src/common/decorators/current-auth-user.decorator';

describe('ContactsController', () => {
    let controller: ContactsController;
    let service: jest.Mocked<ContactsService>;

    const mockAuthUser: AuthUser = {
        id: 'user-123',
        email: 'test@example.com',
    };

    const mockContactId = 'contact-123';

    const mockContact = {
        id: mockContactId,
        owner_id: mockAuthUser.id,
        first_name: 'John',
        last_name: 'Doe',
        company: 'Acme Inc',
        created_at: new Date(),
        updated_at: new Date(),
    };

    beforeEach(async () => {
        const mockService = {
            create: jest.fn(),
            createScannedContact: jest.fn(),
            uploadBusinessCard: jest.fn(),
            search: jest.fn(),
            findDeleted: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            addTags: jest.fn(),
            removeTags: jest.fn(),
            toggleFavorite: jest.fn(),
            togglePin: jest.fn(),
            updateNotes: jest.fn(),
            remove: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            controllers: [ContactsController],
            providers: [
                {
                    provide: ContactsService,
                    useValue: mockService,
                },
            ],
        }).compile();

        controller = module.get<ContactsController>(ContactsController);
        service = module.get(ContactsService);
    });

    it('should be defined', () => {
        expect(controller).toBeDefined();
    });

    describe('create', () => {
        it('should create a contact', async () => {
            const createDto: CreateContactDto = {
                first_name: 'John',
                last_name: 'Doe',
                company: 'Acme Inc',
            };

            service.create.mockResolvedValue(mockContact);

            const result = await controller.create(createDto, mockAuthUser);

            expect(service.create).toHaveBeenCalledWith(createDto, mockAuthUser.id);
            expect(result).toEqual(mockContact);
        });
    });

    describe('createScanned', () => {
        it('should create a scanned contact', async () => {
            const createDto: CreateScannedContactDto = {
                raw_data: 'BEGIN:VCARD\nVERSION:3.0\nEND:VCARD',
                scanned_type: 'qr_code',
            };

            const mockScannedContact = {
                ...mockContact,
                scanned_type: 'qr_code',
            };
            service.createScannedContact.mockResolvedValue(mockScannedContact);

            const result = await controller.createScanned(createDto, mockAuthUser);

            expect(service.createScannedContact).toHaveBeenCalledWith(createDto, mockAuthUser.id);
            expect(result).toEqual(mockScannedContact);
        });
    });

    describe('uploadBusinessCard', () => {
        it('should upload a business card', async () => {
            const file: Express.Multer.File = {
                fieldname: 'file',
                originalname: 'business-card.jpg',
                encoding: '7bit',
                mimetype: 'image/jpeg',
                buffer: Buffer.from('test'),
                size: 1024,
            } as Express.Multer.File;

            const uploadDto: UploadBusinessCardDto = {
                side: 'front',
            };

            const mockUploadResult = {
                ...mockContact,
                document_type: 'business_card',
            };

            service.uploadBusinessCard.mockResolvedValue(mockUploadResult);

            const result = await controller.uploadBusinessCard(file, uploadDto, mockAuthUser);

            expect(service.uploadBusinessCard).toHaveBeenCalledWith(
                mockAuthUser.id,
                file,
                uploadDto,
            );
            expect(result).toEqual(mockUploadResult);
        });
    });

    describe('search', () => {
        it('should search contacts with query and filters', async () => {
            const searchResults = [mockContact];
            service.search.mockResolvedValue(searchResults);

            const result = await controller.search(
                mockAuthUser,
                'John',
                'name',
                'work',
                'conference',
                'qr_code',
                'qr_code',
                'true',
                'true',
            );

            expect(service.search).toHaveBeenCalledWith(mockAuthUser.id, 'John', {
                sortBy: 'name',
                filterByTag: 'work',
                filterByEvent: 'conference',
                filterByAcquiredVia: 'qr_code',
                filterByScannedType: 'qr_code',
                isPinned: true,
                isFavorite: true,
            });
            expect(result).toEqual(searchResults);
        });

        it('should search with empty query', async () => {
            const searchResults = [mockContact];
            service.search.mockResolvedValue(searchResults);

            const result = await controller.search(mockAuthUser, '');

            expect(service.search).toHaveBeenCalledWith(mockAuthUser.id, '', {
                sortBy: undefined,
                filterByTag: undefined,
                filterByEvent: undefined,
                filterByAcquiredVia: undefined,
                filterByScannedType: undefined,
                isPinned: false,
                isFavorite: false,
            });
            expect(result).toEqual(searchResults);
        });

        it('should handle undefined query parameter', async () => {
            const searchResults = [mockContact];
            service.search.mockResolvedValue(searchResults);

            const result = await controller.search(mockAuthUser, undefined);

            expect(service.search).toHaveBeenCalledWith(mockAuthUser.id, '', {
                sortBy: undefined,
                filterByTag: undefined,
                filterByEvent: undefined,
                filterByAcquiredVia: undefined,
                filterByScannedType: undefined,
                isPinned: false,
                isFavorite: false,
            });
            expect(result).toEqual(searchResults);
        });
    });

    describe('getDeleted', () => {
        it('should get deleted contacts', async () => {
            const deletedContacts = [{ ...mockContact, deleted_at: new Date() }];
            service.findDeleted.mockResolvedValue(deletedContacts);

            const result = await controller.getDeleted(mockAuthUser);

            expect(service.findDeleted).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual(deletedContacts);
        });
    });

    describe('findAll', () => {
        it('should find all contacts', async () => {
            const contacts = [mockContact];
            service.findAll.mockResolvedValue(contacts);

            const result = await controller.findAll(mockAuthUser);

            expect(service.findAll).toHaveBeenCalledWith(mockAuthUser.id);
            expect(result).toEqual(contacts);
        });
    });

    describe('findOne', () => {
        it('should find one contact by id', async () => {
            service.findOne.mockResolvedValue(mockContact);

            const result = await controller.findOne(mockContactId, mockAuthUser);

            expect(service.findOne).toHaveBeenCalledWith(mockContactId, mockAuthUser.id);
            expect(result).toEqual(mockContact);
        });
    });

    describe('update', () => {
        it('should update a contact', async () => {
            const updateDto: UpdateContactDto = {
                first_name: 'Jane',
                company: 'New Company',
            };

            const updatedContact = { ...mockContact, ...updateDto };
            service.update.mockResolvedValue(updatedContact);

            const result = await controller.update(mockContactId, updateDto, mockAuthUser);

            expect(service.update).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, updateDto);
            expect(result).toEqual(updatedContact);
        });
    });

    describe('addTags', () => {
        it('should add tags to a contact', async () => {
            const tags = ['work', 'important'];
            const updatedContact = { ...mockContact, tags };
            service.addTags.mockResolvedValue(updatedContact);

            const result = await controller.addTags(mockContactId, tags, mockAuthUser);

            expect(service.addTags).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, tags);
            expect(result).toEqual(updatedContact);
        });
    });

    describe('removeTags', () => {
        it('should remove tags from a contact', async () => {
            const tags = ['work'];
            const updatedContact = { ...mockContact, tags: [] };
            service.removeTags.mockResolvedValue(updatedContact);

            const result = await controller.removeTags(mockContactId, tags, mockAuthUser);

            expect(service.removeTags).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, tags);
            expect(result).toEqual(updatedContact);
        });
    });

    describe('toggleFavorite', () => {
        it('should toggle favorite status to true', async () => {
            const updatedContact = { ...mockContact, is_favorite: true };
            service.toggleFavorite.mockResolvedValue(updatedContact);

            const result = await controller.toggleFavorite(mockContactId, true, mockAuthUser);

            expect(service.toggleFavorite).toHaveBeenCalledWith(
                mockContactId,
                mockAuthUser.id,
                true,
            );
            expect(result).toEqual(updatedContact);
        });

        it('should toggle favorite status to false', async () => {
            const updatedContact = { ...mockContact, is_favorite: false };
            service.toggleFavorite.mockResolvedValue(updatedContact);

            const result = await controller.toggleFavorite(mockContactId, false, mockAuthUser);

            expect(service.toggleFavorite).toHaveBeenCalledWith(
                mockContactId,
                mockAuthUser.id,
                false,
            );
            expect(result).toEqual(updatedContact);
        });
    });

    describe('togglePin', () => {
        it('should toggle pin status to true', async () => {
            const updatedContact = { ...mockContact, is_pinned: true };
            service.togglePin.mockResolvedValue(updatedContact);

            const result = await controller.togglePin(mockContactId, true, mockAuthUser);

            expect(service.togglePin).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, true);
            expect(result).toEqual(updatedContact);
        });

        it('should toggle pin status to false', async () => {
            const updatedContact = { ...mockContact, is_pinned: false };
            service.togglePin.mockResolvedValue(updatedContact);

            const result = await controller.togglePin(mockContactId, false, mockAuthUser);

            expect(service.togglePin).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, false);
            expect(result).toEqual(updatedContact);
        });
    });

    describe('updateNotes', () => {
        it('should update notes', async () => {
            const notes = 'Important contact from conference';
            const updatedContact = { ...mockContact, notes };
            service.updateNotes.mockResolvedValue(updatedContact);

            const result = await controller.updateNotes(mockContactId, notes, mockAuthUser);

            expect(service.updateNotes).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, notes);
            expect(result).toEqual(updatedContact);
        });

        it('should update notes with empty string', async () => {
            const notes = '';
            const updatedContact = { ...mockContact, notes };
            service.updateNotes.mockResolvedValue(updatedContact);

            const result = await controller.updateNotes(mockContactId, notes, mockAuthUser);

            expect(service.updateNotes).toHaveBeenCalledWith(mockContactId, mockAuthUser.id, notes);
            expect(result).toEqual(updatedContact);
        });
    });

    describe('remove', () => {
        it('should soft delete a contact', async () => {
            service.remove.mockResolvedValue(undefined);

            const result = await controller.remove(mockContactId, mockAuthUser);

            expect(service.remove).toHaveBeenCalledWith(mockContactId, mockAuthUser.id);
            expect(result).toBeUndefined();
        });
    });
});
