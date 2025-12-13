import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial, IsNull, Not } from 'typeorm';
import { Contact } from './entities/contact.entity';

@Injectable()
export class ContactRepository {
    constructor(
        @InjectRepository(Contact)
        private readonly repo: Repository<Contact>,
    ) {}

    create(data: DeepPartial<Contact>): Contact {
        return this.repo.create(data) as unknown as Contact;
    }

    save(entity: Contact | DeepPartial<Contact>): Promise<Contact> {
        return this.repo.save(entity as any) as Promise<Contact>;
    }

    findAll(): Promise<Contact[]> {
        return this.repo.find({
            relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
        });
    }

    findOneById(id: string): Promise<Contact | null> {
        return this.repo.findOne({
            where: { id },
            relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
        });
    }

    findByOwnerId(ownerId: string): Promise<Contact[]> {
        return this.repo.find({
            where: { ownerId, deletedAt: IsNull() },
            relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
            order: { createdAt: 'DESC' },
        });
    }

    findByHash(ownerId: string, contactHash: string): Promise<Contact | null> {
        return this.repo.findOne({
            where: { ownerId, contactHash, deletedAt: IsNull() },
            relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
        });
    }

    async searchContacts(
        ownerId: string,
        query: string,
        options?: {
            sortBy?: string;
            filterByTag?: string;
            filterByEvent?: string;
            filterByAcquiredVia?: string;
            filterByScannedType?: string;
            isPinned?: boolean;
            isFavorite?: boolean;
        },
    ): Promise<Contact[]> {
        const qb = this.repo
            .createQueryBuilder('contact')
            .leftJoinAndSelect('contact.phoneNumbers', 'phoneNumbers')
            .leftJoinAndSelect('contact.emails', 'emails')
            .leftJoinAndSelect('contact.addresses', 'addresses')
            .leftJoinAndSelect('contact.links', 'links')
            .leftJoinAndSelect('contact.files', 'files')
            .where('contact.owner_id = :ownerId', { ownerId })
            .andWhere('contact.deleted_at IS NULL');

        // Search across multiple fields
        if (query) {
            qb.andWhere(
                '(contact.name ILIKE :query OR contact.company_name ILIKE :query OR contact.title ILIKE :query OR contact.department ILIKE :query OR EXISTS (SELECT 1 FROM contact_emails e WHERE e.contact_id = contact.id AND e.email ILIKE :query) OR EXISTS (SELECT 1 FROM contact_phone_numbers p WHERE p.contact_id = contact.id AND p.raw_number ILIKE :query))',
                { query: `%${query}%` },
            );
        }

        // Apply filters
        if (options?.filterByTag) {
            qb.andWhere('(:tag = ANY(contact.user_tags) OR :tag = ANY(contact.automatic_tags))', {
                tag: options.filterByTag,
            });
        }

        if (options?.filterByEvent) {
            qb.andWhere('contact.event_id = :eventId', {
                eventId: options.filterByEvent,
            });
        }

        if (options?.filterByAcquiredVia) {
            qb.andWhere('contact.acquired_via = :acquiredVia', {
                acquiredVia: options.filterByAcquiredVia,
            });
        }

        if (options?.filterByScannedType) {
            qb.andWhere('contact.scanned_type = :scannedType', {
                scannedType: options.filterByScannedType,
            });
        }

        if (options?.isPinned !== undefined) {
            qb.andWhere('contact.is_pinned = :isPinned', {
                isPinned: options.isPinned,
            });
        }

        if (options?.isFavorite !== undefined) {
            qb.andWhere('contact.is_favorite = :isFavorite', {
                isFavorite: options.isFavorite,
            });
        }

        // Apply sorting
        switch (options?.sortBy) {
            case 'pinned':
                qb.orderBy('contact.is_pinned', 'DESC').addOrderBy('contact.created_at', 'DESC');
                break;
            case 'favorite':
                qb.orderBy('contact.is_favorite', 'DESC').addOrderBy('contact.created_at', 'DESC');
                break;
            case 'name':
                qb.orderBy('contact.name', 'ASC');
                break;
            case 'tag':
                // Group by tags - sort by first user tag alphabetically, then by name
                qb.orderBy('contact.user_tags', 'ASC').addOrderBy('contact.name', 'ASC');
                break;
            case 'scanned':
                // Group by acquisition method, then scanned type, then date
                qb.orderBy('contact.acquired_via', 'ASC')
                    .addOrderBy('contact.scanned_type', 'ASC')
                    .addOrderBy('contact.created_at', 'DESC');
                break;
            case 'date_added':
            default:
                qb.orderBy('contact.created_at', 'DESC');
                break;
        }

        return qb.getMany();
    }

    findDeleted(ownerId: string): Promise<Contact[]> {
        return this.repo.find({
            where: { ownerId, deletedAt: Not(IsNull()) },
            relations: ['phoneNumbers', 'emails', 'addresses', 'links', 'files'],
            order: { deletedAt: 'DESC' },
        });
    }

    async softDelete(id: string): Promise<void> {
        await this.repo.update(id, { deletedAt: new Date() });
    }

    async restore(id: string): Promise<void> {
        await this.repo.update(id, { deletedAt: null });
    }

    async permanentlyDelete(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    async findExpiredDeleted(daysOld = 30): Promise<Contact[]> {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysOld);

        return this.repo.find({
            where: {
                deletedAt: Not(IsNull()),
            },
            select: ['id', 'deletedAt'],
        });
    }

    remove(entity: Contact): Promise<Contact> {
        return this.repo.remove(entity);
    }
}
