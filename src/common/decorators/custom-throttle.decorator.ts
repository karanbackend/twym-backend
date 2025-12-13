import { Throttle } from '@nestjs/throttler';

/**
 * Configuration for custom rate limiting on a specific route.
 */
export interface CustomThrottleConfig {
    /**
     * Time to live in milliseconds.
     */
    ttl: number;
    /**
     * Maximum number of requests within the TTL window.
     */
    limit: number;
}

/**
 * Decorator to apply custom rate limiting to a specific route.
 * Overrides the global rate limiting configuration for this route.
 *
 * @param config - Custom rate limiting configuration
 *
 * @example
 * // Allow 100 requests per minute for this endpoint
 * @CustomThrottle({ ttl: 60000, limit: 100 })
 * @Post('batch-upload')
 * batchUpload() { ... }
 *
 * @example
 * // Strict rate limiting: 5 requests per 10 seconds
 * @CustomThrottle({ ttl: 10000, limit: 5 })
 * @Post('sensitive-operation')
 * sensitivOperation() { ... }
 */
export const CustomThrottle = (config: CustomThrottleConfig) => {
    return Throttle({ default: config });
};
