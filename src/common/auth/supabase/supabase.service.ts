import {
    Injectable,
    InternalServerErrorException,
    Logger,
    OnModuleInit,
    UnauthorizedException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppConfig } from '../../config/app.config';
import type { JwtConfig, SupabaseConfig } from '../../config/env.config';

@Injectable()
export class SupabaseService implements OnModuleInit {
    private readonly logger = new Logger(SupabaseService.name);

    private supabase!: SupabaseClient;
    private adminSupabase?: SupabaseClient;
    private cachedSigningKey?: string;
    private readonly supabaseCfg: SupabaseConfig;
    private readonly jwtCfg: JwtConfig;

    constructor(appConfig: AppConfig) {
        this.supabaseCfg = appConfig.supabase ?? ({} as SupabaseConfig);
        this.jwtCfg = appConfig.jwt ?? ({} as JwtConfig);
    }

    onModuleInit() {
        this.initSupabaseClient();
        this.tryWarmUpSigningKey();
    }

    private initSupabaseClient(): void {
        const {
            url = '',
            anonKey = '',
            serviceKey = '',
        } = this.supabaseCfg as Partial<SupabaseConfig>;
        // public/anon client for user-scoped operations
        this.supabase = createClient(url, anonKey) as SupabaseClient;

        // admin client (service role) for server-side operations that need elevated privileges
        if (serviceKey) {
            try {
                this.adminSupabase = createClient(url, serviceKey) as SupabaseClient;
                this.logger.log('Initialized Supabase admin client using service role key');
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (err) {
                this.logger.warn('Failed to initialize Supabase admin client');
            }
        } else {
            this.logger.warn('Supabase service key not provided; admin client unavailable');
        }
    }

    private tryWarmUpSigningKey(): void {
        try {
            this.getSigningKey();
            this.logger.log('JWT signing key cached on startup');
        } catch (err) {
            this.logger.warn(`JWT warm-up failed: ${(err as Error).message}`);
        }
    }

    getClient(): SupabaseClient {
        return this.supabase;
    }

    /**
     * Returns the admin (service role) Supabase client. Throws if not configured.
     */
    getAdminClient(): SupabaseClient {
        if (!this.adminSupabase) {
            throw new InternalServerErrorException(
                'Supabase admin client is not configured. Ensure SUPABASE_SERVICE_KEY is set on the server.',
            );
        }
        return this.adminSupabase;
    }

    getSigningKey(): string {
        if (this.cachedSigningKey) {
            return this.cachedSigningKey;
        }

        if (this.jwtCfg.secret) {
            this.cachedSigningKey = this.jwtCfg.secret;
            return this.jwtCfg.secret;
        }

        throw new InternalServerErrorException(
            'JWT secret is not configured. Set jwt.secret in environment variables.',
        );
    }

    async getUserFromSupabase(token: string) {
        const { data, error } = await this.supabase.auth.getUser(token);
        if (error) {
            throw new UnauthorizedException(`Failed to get user from Supabase: ${error.message}`);
        }
        return data.user;
    }
}
