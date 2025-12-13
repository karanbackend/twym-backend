import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ContactFile } from './entities/contact-file.entity';

@Injectable()
export class ContactFileRepository {
    constructor(
        @InjectRepository(ContactFile)
        private readonly repo: Repository<ContactFile>,
    ) {}

    create(data: DeepPartial<ContactFile>): ContactFile {
        return this.repo.create(data) as unknown as ContactFile;
    }

    save(entity: ContactFile | DeepPartial<ContactFile>): Promise<ContactFile> {
        return this.repo.save(entity as any) as Promise<ContactFile>;
    }

    findById(id: string): Promise<ContactFile | null> {
        return this.repo.findOne({ where: { id }, relations: ['contact'] });
    }

    findByContactId(contactId: string): Promise<ContactFile[]> {
        return this.repo.find({
            where: { contactId },
            order: { createdAt: 'DESC' },
        });
    }

    findByFileId(fileId: string): Promise<ContactFile[]> {
        return this.repo.find({
            where: { fileId },
            order: { createdAt: 'DESC' },
        });
    }

    findPendingProcessing(limit = 10): Promise<ContactFile[]> {
        return this.repo.find({
            where: { processingStatus: 'pending' },
            order: { createdAt: 'ASC' },
            take: limit,
        });
    }

    async updateProcessingStatus(
        id: string,
        status: string,
        ocrData?: Partial<ContactFile>,
    ): Promise<ContactFile | null> {
        const file = await this.findById(id);
        if (!file) return null;

        file.processingStatus = status;
        if (ocrData) {
            Object.assign(file, ocrData);
        }

        return this.save(file);
    }

    remove(entity: ContactFile): Promise<ContactFile> {
        return this.repo.remove(entity);
    }

    /**
     * Find an active contact file by contactId, docType, and side.
     * Used to check for unique constraint violations before inserting.
     */
    async findActiveByContactDocSide(
        contactId: string,
        docType: string,
        side: string,
    ): Promise<ContactFile | null> {
        return this.repo.findOne({
            where: {
                contactId,
                docType,
                side,
                isActive: true,
            },
        });
    }

    /**
     * Deactivate an existing contact file (set is_active = false).
     * Used when replacing an existing active file with a new one.
     */
    async deactivate(id: string): Promise<ContactFile | null> {
        const file = await this.findById(id);
        if (!file) return null;

        file.isActive = false;
        return this.save(file);
    }
}
