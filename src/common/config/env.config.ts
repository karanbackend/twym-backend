import { registerAs } from '@nestjs/config';

export type DatabaseConfig = {
    type: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
    url: string | null;
    ssl: boolean;
    synchronize: boolean;
};

export type SupabaseConfig = {
    url: string;
    serviceKey: string;
    anonKey: string;
    bucket: string;
    webhookSecret: string;
};

export type JwtConfig = {
    secret: string;
    // examples: '15m', '1h', '7d' or a numeric ms value
    accessTokenExpiresIn: string | number;
    refreshTokenExpiresIn: string | number;
    issuer: string;
    audience: string;
};

export type RateLimitConfig = {
    ttl: number;
    limit: number;
};

export type CorsConfig = {
    enabled: boolean;
    origin: string | string[] | boolean | RegExp | Array<string | RegExp>;
    credentials: boolean;
};

export type CalendarConfig = {
    encryptionKey: string;
    google: {
        clientId: string;
        clientSecret: string;
    };
    microsoft: {
        clientId: string;
        clientSecret: string;
        tenantId: string;
    };
};

export type GoogleOcrConfig = {
    enabled: boolean;
    credentialsB64?: string;
    credentialsPath?: string;
};

export type AppConfigSchema = {
    env: string;
    database: DatabaseConfig;
    supabase: SupabaseConfig;
    jwt: JwtConfig;
    rateLimit: RateLimitConfig;
    cors: CorsConfig;
    calendar: CalendarConfig;
    frontendUrl?: string;
    apiUrl?: string;
    googleOcr: GoogleOcrConfig;
};

function parseCorsOrigin(envValue?: string): string | string[] | boolean {
    if (!envValue) return true;

    const value = envValue.trim();

    if (/^(true|false)$/i.test(value)) {
        return value.toLowerCase() === 'true';
    }

    if (value.includes(',')) {
        return value.split(',').map((v) => v.trim());
    }

    return value;
}

function withLocalhostInDev(
    origin: string | string[] | boolean,
): string | string[] | boolean | RegExp | Array<string | RegExp> {
    const isProd = (process.env.NODE_ENV ?? 'development') === 'production';
    if (isProd) return origin;

    // Allow common local addresses (with or without explicit port)
    const localRegexes: RegExp[] = [
        /^https?:\/\/localhost(?::\d+)?$/,
        /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
        /^https?:\/\/0\.0\.0\.0(?::\d+)?$/,
        /^https?:\/\/\[::1\](?::\d+)?$/,
    ];

    // Boolean → don't modify
    if (typeof origin === 'boolean') return origin;

    // Array case → avoid duplicates
    if (Array.isArray(origin)) {
        const arr = origin as Array<string | RegExp>;

        const missing = localRegexes.filter(
            (r) => !arr.some((item) => item instanceof RegExp && item.toString() === r.toString()),
        );

        return missing.length ? [...arr, ...missing] : arr;
    }

    // Single string → convert to array + localhost
    return [origin, ...localRegexes];
}

export default registerAs(
    'app',
    (): AppConfigSchema => ({
        env: process.env.NODE_ENV ?? 'development',

        database: {
            type: process.env.DB_TYPE ?? 'postgres',
            host: process.env.DB_HOST ?? 'localhost',
            port: parseInt(process.env.DB_PORT ?? '5432', 10),
            username: process.env.DB_USER ?? 'postgres',
            password: process.env.DB_PASS ?? 'postgres',
            database: process.env.DB_NAME ?? 'twym',
            // if DATABASE_URL is provided (e.g. in production), prefer it
            url: process.env.DATABASE_URL ?? null,
            // TLS/SSL for DB connections
            ssl: (process.env.DB_SSL ?? 'false').toLowerCase() === 'true',
            synchronize: (process.env.TYPEORM_SYNC ?? 'false').toLowerCase() === 'true',
        },

        supabase: {
            url: process.env.SUPABASE_URL ?? '',
            serviceKey: process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_KEY ?? '',
            anonKey: process.env.SUPABASE_ANON_KEY ?? '',
            bucket: process.env.SUPABASE_BUCKET ?? 'public',
            webhookSecret: process.env.SUPABASE_WEBHOOK_SECRET ?? '',
        },

        jwt: {
            secret: process.env.JWT_SECRET ?? 'change-me-in-production',
            // examples: '15m', '1h', '7d' or a numeric value (ms)
            accessTokenExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
            refreshTokenExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
            issuer: process.env.JWT_ISSUER ?? 'twym',
            audience: process.env.JWT_AUDIENCE ?? 'twym-users',
        },

        rateLimit: {
            // Time to live in milliseconds (default: 60 seconds)
            ttl: parseInt(process.env.RATE_LIMIT_TTL ?? '60000', 10),
            // Maximum number of requests within TTL (default: 10 requests per minute)
            limit: parseInt(process.env.RATE_LIMIT_MAX ?? '10', 10),
        },

        cors: {
            enabled: (process.env.CORS_ENABLED ?? 'true').toLowerCase() === 'true',
            origin: withLocalhostInDev(parseCorsOrigin(process.env.CORS_ORIGIN)),
            credentials: (process.env.CORS_CREDENTIALS ?? 'true').toLowerCase() === 'true',
        },

        calendar: {
            encryptionKey: process.env.CALENDAR_ENCRYPTION_KEY ?? '',
            google: {
                clientId: process.env.GOOGLE_CALENDAR_CLIENT_ID ?? '',
                clientSecret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET ?? '',
            },
            microsoft: {
                clientId: process.env.MICROSOFT_CALENDAR_CLIENT_ID ?? '',
                clientSecret: process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ?? '',
                tenantId: process.env.MICROSOFT_CALENDAR_TENANT_ID ?? 'common',
            },
        },

        frontendUrl: process.env.FRONTEND_URL ?? 'https://app.example.com',
        apiUrl: process.env.API_URL ?? 'http://localhost:3000',

        // Google OCR configuration
        googleOcr: {
            enabled: (process.env.GOOGLE_OCR_ENABLED ?? 'false').toLowerCase() === 'true',
            credentialsB64: process.env.GOOGLE_CREDENTIALS_B64,
            credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        },
    }),
);
