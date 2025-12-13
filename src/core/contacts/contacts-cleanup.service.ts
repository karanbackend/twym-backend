import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ContactRepository } from './contact.repository';

/**
 * Service responsible for cleaning up soft-deleted contacts after 30 days
 * US-C18: Delete Contact with 30-day restore window
 */
@Injectable()
export class ContactsCleanupService {
    private readonly logger = new Logger(ContactsCleanupService.name);
    private readonly RETENTION_DAYS = 30;

    constructor(private readonly contactRepo: ContactRepository) {}

    /**
     * Scheduled task that runs daily at 2:00 AM to permanently delete
     * contacts that have been soft-deleted for more than 30 days
     */
    @Cron(CronExpression.EVERY_DAY_AT_2AM)
    async cleanupExpiredContacts(): Promise<void> {
        this.logger.log('Starting expired contacts cleanup...');

        try {
            const expiredContacts = await this.contactRepo.findExpiredDeleted(this.RETENTION_DAYS);

            if (expiredContacts.length === 0) {
                this.logger.log('No expired contacts to clean up');
                return;
            }

            this.logger.log(`Found ${expiredContacts.length} contacts to evaluate for deletion`);

            const now = Date.now();
            const deletedCount = { count: 0 };

            for (const contact of expiredContacts) {
                if (!contact.deletedAt) {
                    continue;
                }

                const daysSinceDeleted = Math.floor(
                    (now - contact.deletedAt.getTime()) / (1000 * 60 * 60 * 24),
                );

                if (daysSinceDeleted >= this.RETENTION_DAYS) {
                    try {
                        await this.contactRepo.permanentlyDelete(contact.id);
                        deletedCount.count++;
                        this.logger.log(
                            `Permanently deleted contact ${contact.id} (deleted ${daysSinceDeleted} days ago)`,
                        );
                    } catch (error) {
                        this.logger.error(
                            `Failed to permanently delete contact ${contact.id}: ${(error as Error).message}`,
                        );
                    }
                }
            }

            this.logger.log(
                `Cleanup complete. Permanently deleted ${deletedCount.count} of ${expiredContacts.length} expired contacts`,
            );
        } catch (error) {
            this.logger.error(
                `Error during contacts cleanup: ${(error as Error).message}`,
                (error as Error).stack,
            );
        }
    }

    /**
     * Manual trigger for cleanup (useful for testing or admin operations)
     */
    async triggerCleanup(): Promise<{ deleted: number; total: number }> {
        this.logger.log('Manual cleanup triggered');

        const expiredContacts = await this.contactRepo.findExpiredDeleted(this.RETENTION_DAYS);

        const now = Date.now();
        let deletedCount = 0;

        for (const contact of expiredContacts) {
            if (!contact.deletedAt) {
                continue;
            }

            const daysSinceDeleted = Math.floor(
                (now - contact.deletedAt.getTime()) / (1000 * 60 * 60 * 24),
            );

            if (daysSinceDeleted >= this.RETENTION_DAYS) {
                await this.contactRepo.permanentlyDelete(contact.id);
                deletedCount++;
            }
        }

        this.logger.log(
            `Manual cleanup complete: ${deletedCount}/${expiredContacts.length} deleted`,
        );

        return {
            deleted: deletedCount,
            total: expiredContacts.length,
        };
    }
}
