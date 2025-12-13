import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFile } from './entities/user-file.entity';

@Injectable()
export class UserFileRepository {
    constructor(
        @InjectRepository(UserFile)
        private readonly repo: Repository<UserFile>,
    ) {}

    create(data: Partial<UserFile>): UserFile {
        return this.repo.create(data);
    }

    async save(entity: UserFile): Promise<UserFile> {
        return this.repo.save(entity);
    }

    async findById(id: string): Promise<UserFile | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findByOwnerId(ownerId: string): Promise<UserFile[]> {
        return this.repo.find({
            where: { ownerId },
            order: { createdAt: 'DESC' },
        });
    }

    async findByOwnerIdAndPurpose(ownerId: string, purpose: string): Promise<UserFile | null> {
        return this.repo.findOne({
            where: { ownerId, purpose },
            order: { createdAt: 'DESC' },
        });
    }

    async deleteById(id: string): Promise<void> {
        await this.repo.delete({ id });
    }

    async deleteByOwnerIdAndPurpose(ownerId: string, purpose: string): Promise<void> {
        await this.repo.delete({ ownerId, purpose });
    }
}
