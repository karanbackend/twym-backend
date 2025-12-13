import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from './supabase.service';
import { UsersService } from '../../../core/users/users.service';
import type { Request } from 'express';

interface SupabaseUser {
    id: string;
    email?: string | null;
    role?: string | null;
    app_metadata?: Record<string, unknown> | null;
    user_metadata?: Record<string, unknown> | null;
    aud?: string | null;
    exp?: number | null;
    iat?: number | null;
    [key: string]: unknown;
}

type AuthenticatedRequest = Request & {
    supabaseUser?: SupabaseUser;
    user?: {
        id: string;
        email?: string | null;
        role?: string | null;
    };
};

@Injectable()
export class SupabaseAuthGuard extends AuthGuard('supabase') {
    private readonly logger = new Logger(SupabaseAuthGuard.name);

    constructor(
        private readonly reflector: Reflector,
        private readonly supabaseService: SupabaseService,
        private readonly usersService: UsersService,
    ) {
        super();
    }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        if (this.isPublicRoute(context)) return true;

        const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

        const token = this.extractToken(req);
        if (!token) {
            this.logger.error('Authorization token missing or malformed');
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }
        // connecgtion are valid for copilo
        const supabaseUser = await this.getSupabaseUser(token);
        req.authInfo = supabaseUser;

        await this.ensureLocalUserExists(supabaseUser.id);
        await this.verifyUserIsActive(supabaseUser.id);

        // Set req.user so that CurrentAuthUser decorator can access it
        req.user = {
            id: supabaseUser.id,
            email: supabaseUser.email,
            role: supabaseUser.role,
        };

        return true;
    }

    private isPublicRoute(context: ExecutionContext): boolean {
        return this.reflector.getAllAndOverride<boolean>('isPublic', [
            context.getHandler(),
            context.getClass(),
        ]);
    }

    private extractToken(req: AuthenticatedRequest): string | null {
        const authHeader = req.headers?.authorization;
        if (!authHeader) return null;
        if (!authHeader.startsWith('Bearer ')) return null;
        return authHeader.slice(7);
    }

    private async getSupabaseUser(token: string): Promise<SupabaseUser> {
        const maybeUser = await this.supabaseService.getUserFromSupabase(token);
        if (!maybeUser || typeof (maybeUser as { id?: unknown }).id !== 'string') {
            throw new UnauthorizedException('Authenticated user not found');
        }
        return maybeUser as unknown as SupabaseUser;
    }

    private async ensureLocalUserExists(supabaseId: string): Promise<void> {
        await this.usersService.ensureUserExists(supabaseId);
    }

    private async verifyUserIsActive(userId: string): Promise<void> {
        const user = await this.usersService.findOne(userId);
        if (!user) {
            this.logger.error(`User ${userId} not found during auth verification`);
            throw new UnauthorizedException('User account not found');
        }
        if (!user.isActive) {
            this.logger.warn(`User ${userId} attempted to authenticate with inactive account`);
            throw new UnauthorizedException(
                'Account is locked or pending deletion. Please contact support.',
            );
        }
    }
}
