import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CalendarConnection } from '../entities/calendar.entity';
import { CalendarProvider } from '../dto';

@Injectable()
export class CalendarConnectionRepository {
    constructor(
        @InjectRepository(CalendarConnection)
        private readonly repository: Repository<CalendarConnection>,
    ) {}

    async findByUserId(userId: string): Promise<CalendarConnection | null> {
        return this.repository.findOne({ where: { userId } });
    }

    async findByUserIdAndProvider(
        userId: string,
        provider: CalendarProvider,
    ): Promise<CalendarConnection | null> {
        return this.repository.findOne({ where: { userId, provider } });
    }

    async findAllByUserId(userId: string): Promise<CalendarConnection[]> {
        return this.repository.find({ where: { userId, isActive: true } });
    }

    async findById(id: string): Promise<CalendarConnection | null> {
        return this.repository.findOne({ where: { id } });
    }

    async findExpiredTokens(): Promise<CalendarConnection[]> {
        return this.repository
            .createQueryBuilder('connection')
            .where('connection.isActive = :isActive', { isActive: true })
            .andWhere('connection.tokenExpiresAt IS NOT NULL')
            .andWhere('connection.tokenExpiresAt < :now', { now: new Date() })
            .getMany();
    }

    async create(data: Partial<CalendarConnection>): Promise<CalendarConnection> {
        const connection = this.repository.create(data);
        return this.repository.save(connection);
    }

    async update(id: string, data: Partial<CalendarConnection>): Promise<CalendarConnection> {
        await this.repository.update(id, data);
        const result = await this.findById(id);
        if (!result) {
            throw new Error(`CalendarConnection with id ${id} not found`);
        }
        return result;
    }

    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }

    async incrementSyncFailureCount(id: string): Promise<void> {
        await this.repository.increment({ id }, 'syncFailureCount', 1);
    }

    async resetSyncFailureCount(id: string): Promise<void> {
        await this.repository.update(id, { syncFailureCount: 0 });
    }
}
