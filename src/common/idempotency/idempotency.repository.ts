import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity';
import { IdempotencyKey } from './idempotency.entity';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class IdempotencyRepository {
    constructor(
        @InjectRepository(IdempotencyKey)
        private readonly repo: Repository<IdempotencyKey>,
    ) {}

    async exists(key: string): Promise<boolean> {
        const found = await this.repo.findOne({ where: { key } });
        return !!found;
    }

    async create(key: string, userId: string | undefined, endpoint: string): Promise<void> {
        const expiresAt = new Date(Date.now() + ONE_DAY_MS);
        const record = {
            key,
            userId,
            endpoint,
            expiresAt,
        } as QueryDeepPartialEntity<IdempotencyKey>;
        try {
            await this.repo.insert(record);
        } catch {
            // ignore duplicates
        }
    }
}
