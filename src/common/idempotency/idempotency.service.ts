import { Injectable } from '@nestjs/common';
import { IdempotencyRepository } from './idempotency.repository';

@Injectable()
export class IdempotencyService {
    constructor(private readonly repo: IdempotencyRepository) {}

    async seen(key: string): Promise<boolean> {
        return this.repo.exists(key);
    }

    async mark(key: string, userId: string | undefined, endpoint: string): Promise<void> {
        await this.repo.create(key, userId, endpoint);
    }
}
