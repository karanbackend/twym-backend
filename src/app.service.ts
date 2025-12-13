import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ConfigService } from '@nestjs/config';
import { ApiInfoResponseDto } from './common/dto/api-info-response.dto';
import { AppConfig } from './common/config/app.config';

@Injectable()
export class AppService {
    constructor(
        private readonly configService: ConfigService,
        private readonly appConfig: AppConfig,
    ) {}

    getApiInfo(req?: Request): ApiInfoResponseDto {
        const environment = this.configService.get<string>('app.env', 'development');
        // Prefer request-derived origin; fallback to configured API_URL
        const apiOrigin = this.resolveApiOrigin(req) ?? this.appConfig.apiUrl;
        const baseUrl = `${apiOrigin}/api/v1`;
        const docsUrl =
            environment === 'production'
                ? 'Documentation not available in production'
                : `${apiOrigin}/api/docs`;

        return {
            name: 'Twym Connect API',
            version: this.getVersion(),
            description: 'Twym Connect backend API for managing profiles, users, and related data',
            environment,
            documentation: docsUrl,
            baseUrl,
            status: 'operational',
            timestamp: new Date().toISOString(),
        };
    }

    private resolveApiOrigin(req?: Request): string | undefined {
        if (!req) return undefined;

        // Respect reverse proxy headers if present
        const forwardedProto = (req.headers['x-forwarded-proto'] as string) || '';
        const forwardedHost = (req.headers['x-forwarded-host'] as string) || '';
        const forwardedPort = (req.headers['x-forwarded-port'] as string) || '';

        // When behind proxies like Nginx/Cloudflare, these are reliable
        if (forwardedHost) {
            const proto = forwardedProto || 'https';
            const host = forwardedHost;
            const portSuffix =
                forwardedPort && !/^(80|443)$/.test(forwardedPort) ? `:${forwardedPort}` : '';
            return `${proto}://${host}${portSuffix}`;
        }

        // Fallback to direct request info
        const hostHeader = (req.headers['host'] as string) || '';
        if (!hostHeader) return undefined;

        // Try to infer protocol
        const isSecure = req.protocol === 'https' || req.secure === true;
        const proto = isSecure ? 'https' : 'http';
        return `${proto}://${hostHeader}`;
    }

    private cachedVersion?: string;
    private getVersion(): string {
        if (this.cachedVersion) return this.cachedVersion;
        try {
            const pkgPath = join(process.cwd(), 'package.json');
            const content = readFileSync(pkgPath, 'utf-8');
            const parsed = JSON.parse(content) as unknown;
            let version = 'unknown';
            if (
                parsed !== null &&
                typeof parsed === 'object' &&
                'version' in parsed &&
                typeof (parsed as { version?: unknown }).version === 'string'
            ) {
                version = (parsed as { version: string }).version;
            }
            this.cachedVersion = version;
            return version;
        } catch {
            return 'unknown';
        }
    }
}
