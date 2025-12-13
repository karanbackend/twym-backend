import { computeFileHash } from '../../../src/common/utils/hash.util';
describe('hash.util', () => {
    describe('computeFileHash', () => {
        it('should compute SHA-256 hash for a buffer', () => {
            const buffer = Buffer.from('test data');
            const hash = computeFileHash(buffer);
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });
        it('should produce consistent hash for same content', () => {
            const buffer1 = Buffer.from('identical content');
            const buffer2 = Buffer.from('identical content');
            const hash1 = computeFileHash(buffer1);
            const hash2 = computeFileHash(buffer2);
            expect(hash1).toBe(hash2);
        });
        it('should produce different hashes for different content', () => {
            const buffer1 = Buffer.from('content one');
            const buffer2 = Buffer.from('content two');
            const hash1 = computeFileHash(buffer1);
            const hash2 = computeFileHash(buffer2);
            expect(hash1).not.toBe(hash2);
        });
        it('should handle empty buffer', () => {
            const buffer = Buffer.from('');
            const hash = computeFileHash(buffer);
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });
        it('should handle large buffers', () => {
            const largeBuffer = Buffer.alloc(1024 * 1024);
            const hash = computeFileHash(largeBuffer);
            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });
        it('should produce expected hash for known content', () => {
            const buffer = Buffer.from('hello');
            const hash = computeFileHash(buffer);
            expect(hash).toBe('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824');
        });
    });
});
