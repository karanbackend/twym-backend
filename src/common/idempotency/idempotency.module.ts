import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IdempotencyKey } from './idempotency.entity';
import { IdempotencyRepository } from './idempotency.repository';
import { IdempotencyService } from './idempotency.service';

@Module({
    imports: [TypeOrmModule.forFeature([IdempotencyKey])],
    providers: [IdempotencyRepository, IdempotencyService],
    exports: [IdempotencyService],
})
export class IdempotencyModule {}
