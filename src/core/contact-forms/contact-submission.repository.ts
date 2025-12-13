import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { ContactSubmission } from './entities/contact-submission.entity';

@Injectable()
export class ContactSubmissionRepository {
    constructor(
        @InjectRepository(ContactSubmission)
        private readonly repo: Repository<ContactSubmission>,
    ) {}

    create(data: DeepPartial<ContactSubmission>): ContactSubmission {
        return this.repo.create(data) as unknown as ContactSubmission;
    }

    save(entity: ContactSubmission | DeepPartial<ContactSubmission>): Promise<ContactSubmission> {
        return this.repo.save(entity as any) as Promise<ContactSubmission>;
    }

    findAll(): Promise<ContactSubmission[]> {
        return this.repo.find({
            order: { createdAt: 'DESC' },
        });
    }

    findOneById(id: string): Promise<ContactSubmission | null> {
        return this.repo.findOne({
            where: { id },
        });
    }

    findByProfileId(profileId: string): Promise<ContactSubmission[]> {
        return this.repo.find({
            where: { profileId },
            order: { createdAt: 'DESC' },
        });
    }

    findUnreadByProfileId(profileId: string): Promise<ContactSubmission[]> {
        return this.repo.find({
            where: { profileId, isRead: false },
            order: { createdAt: 'DESC' },
        });
    }

    async countUnreadByProfileId(profileId: string): Promise<number> {
        return this.repo.count({
            where: { profileId, isRead: false },
        });
    }

    findByFormId(formId: string): Promise<ContactSubmission[]> {
        return this.repo.find({
            where: { formId },
            order: { createdAt: 'DESC' },
        });
    }

    async countSubmissionsByIpToday(ip: string): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return this.repo
            .createQueryBuilder('submission')
            .where('submission.visitor_ip = :ip', { ip })
            .andWhere('submission.created_at >= :today', { today })
            .getCount();
    }

    async findExpiredSubmissions(): Promise<ContactSubmission[]> {
        return this.repo
            .createQueryBuilder('submission')
            .where('submission.expires_at < :now', { now: new Date() })
            .andWhere('submission.expires_at IS NOT NULL')
            .getMany();
    }

    async remove(entity: ContactSubmission): Promise<void> {
        await this.repo.remove(entity);
    }

    async removeMany(entities: ContactSubmission[]): Promise<void> {
        await this.repo.remove(entities);
    }
}
