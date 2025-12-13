import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CalendarConnectionRepository } from '../calendar/repositories';
import { CalendarProviderFactory } from '../calendar/providers';
import { encrypt, decrypt } from '../utils/encryption.util';
import type { CalendarProvider } from '../calendar/dto';

@Injectable()
export class CalendarTokenRefreshScheduler {
    private readonly logger = new Logger(CalendarTokenRefreshScheduler.name);

    constructor(
        private readonly connectionRepository: CalendarConnectionRepository,
        private readonly providerFactory: CalendarProviderFactory,
    ) {}

    /**
     * Cron job to refresh expired tokens
     * Runs every hour to check for expired tokens and refresh them
     */
    @Cron(CronExpression.EVERY_HOUR)
    async refreshExpiredTokens(): Promise<void> {
        this.logger.log('Running token refresh cron job');

        const expiredConnections = await this.connectionRepository.findExpiredTokens();

        if (expiredConnections.length === 0) {
            this.logger.log('No expired tokens found');
            return;
        }

        this.logger.log(`Found ${expiredConnections.length} expired token(s) to refresh`);

        let successCount = 0;
        let failureCount = 0;

        for (const connection of expiredConnections) {
            try {
                await this.refreshToken(connection);
                successCount++;
                this.logger.log(`Successfully refreshed token for connection ${connection.id}`);
            } catch (error) {
                failureCount++;
                this.logger.error(
                    `Failed to refresh token for connection ${connection.id}`,
                    error instanceof Error ? error.stack : String(error),
                );
            }
        }

        this.logger.log(
            `Token refresh complete: ${successCount} succeeded, ${failureCount} failed`,
        );
    }

    /**
     * Refresh a single connection's token
     */
    private async refreshToken(connection: {
        id: string;
        refreshTokenEncrypted?: string | null;
        provider: string;
    }): Promise<void> {
        if (!connection.refreshTokenEncrypted) {
            throw new Error('No refresh token available');
        }

        const refreshToken = decrypt(connection.refreshTokenEncrypted);
        const provider = this.providerFactory.getProvider(connection.provider as CalendarProvider);

        const tokens = await provider.refreshAccessToken(refreshToken);

        // Encrypt and save new tokens
        const accessTokenEncrypted = encrypt(tokens.accessToken);
        const refreshTokenEncrypted = tokens.refreshToken
            ? encrypt(tokens.refreshToken)
            : connection.refreshTokenEncrypted;

        await this.connectionRepository.update(connection.id, {
            accessTokenEncrypted,
            refreshTokenEncrypted,
            tokenExpiresAt: tokens.expiresAt,
        });
    }
}
