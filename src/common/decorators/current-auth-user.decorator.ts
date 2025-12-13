import {
    createParamDecorator,
    ExecutionContext,
    SetMetadata,
    UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

// Minimal auth user shape used across the app. Expand as needed.
export type AuthUser = {
    id: string;
    email?: string;
    [key: string]: unknown;
};

export const CurrentAuthUser = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): AuthUser => {
        const request = ctx.switchToHttp().getRequest<Request & { user?: AuthUser }>();

        if (!request.user) {
            throw new UnauthorizedException(
                'User not authenticated. This should not happen if guard is properly configured.',
            );
        }

        return request.user;
    },
);

export const IsPublic = () => SetMetadata('isPublic', true);
