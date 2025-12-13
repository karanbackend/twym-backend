import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UsersRepository {
    private readonly logger = new Logger(UsersRepository.name);
    constructor(
        @InjectRepository(User)
        private readonly repo: Repository<User>,
    ) {}

    async findById(id: string): Promise<User | null> {
        return this.repo.findOne({ where: { id } });
    }

    async findAll(): Promise<User[]> {
        return this.repo.find({ order: { createdAt: 'DESC' } });
    }

    async create(user: Partial<User>): Promise<User> {
        const ent = this.repo.create(user as User);
        return this.repo.save(ent);
    }

    async update(id: string, patch: Partial<User>): Promise<User> {
        const entity = await this.repo.preload({ id, ...patch });
        if (!entity) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        return this.repo.save(entity);
    }

    async delete(id: string): Promise<void> {
        await this.repo.delete(id);
    }

    // Schedule deletion: mark account as deleted (soft lock) and set timestamps
    async scheduleDeletion(id: string, scheduledFor: Date): Promise<User> {
        const user = await this.findById(id);
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        user.deletionRequestedAt = new Date();
        user.deletionScheduledFor = scheduledFor;
        user.isActive = false;
        return this.repo.save(user);
    }

    // Cancel a previously scheduled deletion
    async cancelDeletion(id: string): Promise<User> {
        const user = await this.findById(id);
        if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        user.deletionRequestedAt = null;
        user.deletionScheduledFor = null;
        user.isActive = true;
        return this.repo.save(user);
    }

    // Permanently remove users whose scheduled deletion time has passed
    async hardDeleteExpired(now: Date): Promise<number> {
        const qb = this.repo.createQueryBuilder('u');
        const expired = await qb
            .where('u.deletion_scheduled_for IS NOT NULL')
            .andWhere('u.deletion_scheduled_for <= :now', { now })
            .getMany();

        if (expired.length === 0) return 0;

        const ids = expired.map((e) => e.id);
        this.logger.log(`Hard deleting ${ids.length} users: ${ids.join(', ')}`);
        const res = await this.repo.delete(ids);
        return res.affected ?? ids.length;
    }
}
