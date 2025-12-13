import * as crypto from 'crypto';

/**
 * Stateless helper: compute SHA-256 hex digest for a Buffer.
 * Pure function with no side-effects so it's easy to unit test.
 */
export function computeFileHash(buffer: Buffer): string {
    return crypto.createHash('sha256').update(buffer).digest('hex');
}
