import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';

// Runs a simple periodic cleanup to permanently remove accounts whose scheduled deletion date has passed.
@Injectable()
export class UserDeletionCleanupService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(UserDeletionCleanupService.name);
    private interval?: NodeJS.Timeout;
    private readonly CHECK_INTERVAL_MS = 1000 * 60 * 60 * 24; // once per day

    constructor(private readonly usersRepo: UsersRepository) {}

    async onModuleInit() {
        this.logger.log('Starting user deletion cleanup job');
        // Run immediately once on startup
        await this.runOnce();
        // Schedule periodic run
        this.interval = setInterval(() => {
            void this.runOnce().catch((err) => this.logger.error(err));
        }, this.CHECK_INTERVAL_MS);
    }

    async runOnce() {
        const now = new Date();
        this.logger.log('Running user deletion cleanup');
        const deleted = await this.usersRepo.hardDeleteExpired(now);
        this.logger.log(`Hard deleted ${deleted} users`);
    }

    onModuleDestroy() {
        if (this.interval) {
            clearInterval(this.interval);
        }
    }
}
