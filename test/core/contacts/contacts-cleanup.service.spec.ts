import { Test, TestingModule } from '@nestjs/testing';
import { ContactsCleanupService } from '../../../src/core/contacts/contacts-cleanup.service';
import { ContactRepository } from '../../../src/core/contacts/contact.repository';

describe('ContactsCleanupService', () => {
    let service: ContactsCleanupService;
    let mockContactRepo: Partial<ContactRepository>;

    beforeEach(async () => {
        mockContactRepo = {
            findExpiredDeleted: jest.fn(),
            permanentlyDelete: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ContactsCleanupService,
                { provide: ContactRepository, useValue: mockContactRepo },
            ],
        }).compile();

        service = module.get<ContactsCleanupService>(ContactsCleanupService);
    });

    describe('cleanupExpiredContacts', () => {
        it('should permanently delete contacts older than 30 days', async () => {
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

            const expiredContacts = [
                { id: 'contact-1', deletedAt: expiredDate },
                { id: 'contact-2', deletedAt: expiredDate },
            ];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(expiredContacts));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            await service.cleanupExpiredContacts();

            expect(mockContactRepo.findExpiredDeleted).toHaveBeenCalledWith(30);
            expect(mockContactRepo.permanentlyDelete).toHaveBeenCalledTimes(2);
            expect(mockContactRepo.permanentlyDelete).toHaveBeenCalledWith('contact-1');
            expect(mockContactRepo.permanentlyDelete).toHaveBeenCalledWith('contact-2');
        });

        it('should not delete contacts less than 30 days old', async () => {
            const now = new Date();
            const recentDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

            const recentContacts = [{ id: 'contact-1', deletedAt: recentDate }];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(recentContacts));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            await service.cleanupExpiredContacts();

            expect(mockContactRepo.findExpiredDeleted).toHaveBeenCalled();
            expect(mockContactRepo.permanentlyDelete).not.toHaveBeenCalled();
        });

        it('should handle empty list gracefully', async () => {
            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve([]));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            await service.cleanupExpiredContacts();

            expect(mockContactRepo.findExpiredDeleted).toHaveBeenCalled();
            expect(mockContactRepo.permanentlyDelete).not.toHaveBeenCalled();
        });

        it('should handle contacts without deletedAt', async () => {
            const contacts = [{ id: 'contact-1', deletedAt: undefined }];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(contacts as any));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            await service.cleanupExpiredContacts();

            expect(mockContactRepo.permanentlyDelete).not.toHaveBeenCalled();
        });

        it('should continue cleanup if one deletion fails', async () => {
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

            const expiredContacts = [
                { id: 'contact-1', deletedAt: expiredDate },
                { id: 'contact-2', deletedAt: expiredDate },
                { id: 'contact-3', deletedAt: expiredDate },
            ];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(expiredContacts));
            mockContactRepo.permanentlyDelete = jest
                .fn()
                .mockResolvedValueOnce(undefined) // contact-1 succeeds
                .mockRejectedValueOnce(new Error('Database error')) // contact-2 fails
                .mockResolvedValueOnce(undefined); // contact-3 succeeds

            // Mock logger to suppress error logs
            const loggerErrorSpy = jest
                .spyOn((service as any).logger, 'error')
                .mockImplementation();

            await service.cleanupExpiredContacts();

            expect(mockContactRepo.permanentlyDelete).toHaveBeenCalledTimes(3);

            loggerErrorSpy.mockRestore();
        });

        it('should handle exactly 30 days correctly', async () => {
            const now = new Date();
            const exactly30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

            const contacts = [{ id: 'contact-1', deletedAt: exactly30Days }];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(contacts));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            await service.cleanupExpiredContacts();

            expect(mockContactRepo.permanentlyDelete).toHaveBeenCalledWith('contact-1');
        });
    });

    describe('triggerCleanup', () => {
        it('should return deletion statistics', async () => {
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);

            const expiredContacts = [
                { id: 'contact-1', deletedAt: expiredDate },
                { id: 'contact-2', deletedAt: expiredDate },
            ];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(expiredContacts));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            const result = await service.triggerCleanup();

            expect(result).toEqual({
                deleted: 2,
                total: 2,
            });
        });

        it('should return correct statistics with mixed ages', async () => {
            const now = new Date();
            const expiredDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000);
            const recentDate = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

            const contacts = [
                { id: 'contact-1', deletedAt: expiredDate },
                { id: 'contact-2', deletedAt: recentDate },
                { id: 'contact-3', deletedAt: expiredDate },
            ];

            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve(contacts));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            const result = await service.triggerCleanup();

            expect(result).toEqual({
                deleted: 2,
                total: 3,
            });
            expect(mockContactRepo.permanentlyDelete).toHaveBeenCalledTimes(2);
        });

        it('should return zero deletions when no expired contacts', async () => {
            mockContactRepo.findExpiredDeleted = jest.fn(() => Promise.resolve([]));
            mockContactRepo.permanentlyDelete = jest.fn(() => Promise.resolve());

            const result = await service.triggerCleanup();

            expect(result).toEqual({
                deleted: 0,
                total: 0,
            });
        });
    });
});
