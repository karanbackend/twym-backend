import { SkipThrottle as NestSkipThrottle } from '@nestjs/throttler';

/**
 * Decorator to skip rate limiting for a specific route or controller.
 *
 * @example
 * // Skip rate limiting for a specific route
 * @SkipThrottle()
 * @Get('health')
 * getHealth() { ... }
 *
 * @example
 * // Skip rate limiting for an entire controller
 * @SkipThrottle()
 * @Controller('webhooks')
 * export class WebhooksController { ... }
 */
export const SkipThrottle = NestSkipThrottle;
