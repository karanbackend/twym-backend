import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { SupabaseService } from './supabase.service';

interface JwtPayload {
    sub: string;
    email?: string;
    role?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    aud?: string;
    exp?: number;
    iat?: number;
}

@Injectable()
export class SupabaseAuthStrategy extends PassportStrategy(Strategy, 'supabase') {
    constructor(private readonly supabaseService: SupabaseService) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKeyProvider: (
                request: unknown,
                rawJwtToken: string,
                done: (err: Error | null, secret?: string | null) => void,
            ): void => {
                try {
                    const signingKey = this.supabaseService.getSigningKey();
                    done(null, signingKey);
                } catch (error) {
                    done(error as Error, null);
                }
            },
            algorithms: ['HS256'],
        });
    }

    validate(payload: JwtPayload) {
        if (!payload.sub) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
            app_metadata: payload.app_metadata,
            user_metadata: payload.user_metadata,
            aud: payload.aud,
            exp: payload.exp,
        } as const;
    }
}
