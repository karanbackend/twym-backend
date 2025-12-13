import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
    DatabaseConfig,
    JwtConfig,
    SupabaseConfig,
    RateLimitConfig,
    CorsConfig,
    CalendarConfig,
    GoogleOcrConfig,
} from './env.config';
@Injectable()
export class AppConfig {
    constructor(private config: ConfigService) {}

    get env(): string | undefined {
        return this.config.get<string>('app.env');
    }

    get database(): DatabaseConfig | undefined {
        return this.config.get<DatabaseConfig>('app.database');
    }

    get supabase(): SupabaseConfig | undefined {
        return this.config.get<SupabaseConfig>('app.supabase');
    }

    get jwt(): JwtConfig | undefined {
        return this.config.get<JwtConfig>('app.jwt');
    }

    get rateLimit(): RateLimitConfig {
        return this.config.get<RateLimitConfig>('app.rateLimit')!;
    }

    get cors(): CorsConfig {
        return this.config.get<CorsConfig>('app.cors')!;
    }

    /**
     * Frontend base URL for building profile QR links and other frontend URLs.
     */
    get frontendUrl(): string {
        const url = this.config.get<string>('app.frontendUrl')!;
        return url.replace(/\/$/, '');
    }

    /**
     * Backend API base URL for building backend endpoints used in some QR payloads (vCard download etc).
     */
    get apiUrl(): string {
        const url = this.config.get<string>('app.apiUrl')!;
        return url.replace(/\/$/, '');
    }

    /**
     * Calendar integration configuration
     */
    get calendar(): CalendarConfig {
        return this.config.get<CalendarConfig>('app.calendar')!;
    }

    /**
     * Feature flags
     * Google OCR configuration
     */
    get googleOcr(): GoogleOcrConfig {
        return this.config.get<GoogleOcrConfig>('app.googleOcr')!;
    }
}
