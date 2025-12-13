import { encrypt, decrypt, safeDecrypt } from '../../../src/common/utils/encryption.util';

describe('Encryption Utils', () => {
    const originalEnv = process.env.CALENDAR_ENCRYPTION_KEY;
    let consoleErrorSpy: jest.SpyInstance;

    beforeEach(() => {
        // Set a test encryption key
        process.env.CALENDAR_ENCRYPTION_KEY = 'test-encryption-key-for-testing';
        // Clear the cached key by accessing the module internals
        jest.resetModules();
        // Suppress expected console.error logs during tests
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    });

    afterEach(() => {
        // Restore console.error
        consoleErrorSpy.mockRestore();
        // Restore original environment
        if (originalEnv) {
            process.env.CALENDAR_ENCRYPTION_KEY = originalEnv;
        } else {
            delete process.env.CALENDAR_ENCRYPTION_KEY;
        }
    });

    describe('encrypt', () => {
        it('should successfully encrypt a string', () => {
            const plainText = 'my-secret-token';

            const encrypted = encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(typeof encrypted).toBe('string');
            expect(encrypted).not.toBe(plainText);
            // Should be in format: iv:authTag:encryptedData
            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should produce different ciphertext for same input (due to random IV)', () => {
            const plainText = 'my-secret-token';

            const encrypted1 = encrypt(plainText);
            const encrypted2 = encrypt(plainText);

            expect(encrypted1).not.toBe(encrypted2);
        });

        it('should throw error when encrypting empty string', () => {
            expect(() => encrypt('')).toThrow('Cannot encrypt empty text');
        });

        it('should handle special characters', () => {
            const plainText = 'token-with-special-chars: !@#$%^&*()_+={}[]|\\:";\'<>?,./';

            const encrypted = encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should handle unicode characters', () => {
            const plainText = 'token-with-unicode-字符-🚀';

            const encrypted = encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted.split(':')).toHaveLength(3);
        });

        it('should handle long strings', () => {
            const plainText = 'a'.repeat(10000);

            const encrypted = encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted.split(':')).toHaveLength(3);
        });
    });

    describe('decrypt', () => {
        it('should successfully decrypt encrypted string', () => {
            const plainText = 'my-secret-token';

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should decrypt string with special characters', () => {
            const plainText = 'token-with-special-chars: !@#$%^&*()_+={}[]|\\:";\'<>?,./';

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should decrypt string with unicode characters', () => {
            const plainText = 'token-with-unicode-字符-🚀';

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should decrypt long strings', () => {
            const plainText = 'a'.repeat(10000);

            const encrypted = encrypt(plainText);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        it('should throw error when decrypting empty string', () => {
            expect(() => decrypt('')).toThrow('Cannot decrypt empty text');
        });

        it('should throw error for invalid encrypted format', () => {
            expect(() => decrypt('invalid-format')).toThrow('Invalid encrypted text format');
        });

        it('should throw error for malformed encrypted data with only 2 parts', () => {
            expect(() => decrypt('part1:part2')).toThrow('Invalid encrypted text format');
        });

        it('should throw error for malformed encrypted data with 4 parts', () => {
            expect(() => decrypt('part1:part2:part3:part4')).toThrow(
                'Invalid encrypted text format',
            );
        });

        it('should throw error for tampered encrypted data', () => {
            const plainText = 'my-secret-token';
            const encrypted = encrypt(plainText);

            // Tamper with the encrypted data
            const parts = encrypted.split(':');
            parts[2] = parts[2].substring(0, parts[2].length - 2) + 'ff';
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow();
        });

        it('should throw error for tampered auth tag', () => {
            const plainText = 'my-secret-token';
            const encrypted = encrypt(plainText);

            // Tamper with the auth tag
            const parts = encrypted.split(':');
            parts[1] = parts[1].substring(0, parts[1].length - 2) + 'ff';
            const tampered = parts.join(':');

            expect(() => decrypt(tampered)).toThrow();
        });

        it('should throw error when decrypting with different encryption key', () => {
            const plainText = 'my-secret-token';
            const encrypted = encrypt(plainText);

            // Change the encryption key
            process.env.CALENDAR_ENCRYPTION_KEY = 'different-key';
            // Force module reload to clear cached key
            jest.resetModules();
            // eslint-disable-next-line @typescript-eslint/no-require-imports
            const encryptionModule = require('../../../src/common/utils/encryption.util');
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return
            expect(() => encryptionModule.decrypt(encrypted)).toThrow();
        });
    });

    describe('safeDecrypt', () => {
        it('should successfully decrypt valid encrypted string', () => {
            const plainText = 'my-secret-token';
            const encrypted = encrypt(plainText);

            const result = safeDecrypt(encrypted);

            expect(result).toBe(plainText);
        });

        it('should return null for invalid encrypted format', () => {
            const result = safeDecrypt('invalid-format');

            expect(result).toBeNull();
        });

        it('should return null for empty string', () => {
            const result = safeDecrypt('');

            expect(result).toBeNull();
        });

        it('should return null for tampered encrypted data', () => {
            const plainText = 'my-secret-token';
            const encrypted = encrypt(plainText);

            // Tamper with the encrypted data
            const parts = encrypted.split(':');
            parts[2] = parts[2].substring(0, parts[2].length - 2) + 'ff';
            const tampered = parts.join(':');

            const result = safeDecrypt(tampered);

            expect(result).toBeNull();
        });

        it('should return null for malformed encrypted data', () => {
            const result = safeDecrypt('part1:part2');

            expect(result).toBeNull();
        });

        it('should not throw error on decryption failure', () => {
            expect(() => safeDecrypt('invalid-data')).not.toThrow();
        });
    });

    describe('round-trip encryption/decryption', () => {
        it('should handle multiple encrypt/decrypt cycles', () => {
            const plainText = 'my-secret-token';

            const encrypted1 = encrypt(plainText);
            const decrypted1 = decrypt(encrypted1);

            const encrypted2 = encrypt(decrypted1);
            const decrypted2 = decrypt(encrypted2);

            expect(decrypted1).toBe(plainText);
            expect(decrypted2).toBe(plainText);
        });

        it('should handle JSON strings', () => {
            const jsonData = JSON.stringify({
                accessToken: 'access-123',
                refreshToken: 'refresh-456',
                expiresIn: 3600,
            });

            const encrypted = encrypt(jsonData);
            const decrypted = decrypt(encrypted);

            expect(decrypted).toBe(jsonData);
            expect(JSON.parse(decrypted)).toEqual({
                accessToken: 'access-123',
                refreshToken: 'refresh-456',
                expiresIn: 3600,
            });
        });
    });

    describe('encryption key caching', () => {
        it('should use cached key for subsequent operations', () => {
            const plainText = 'test-token';

            // First encryption should cache the key
            const encrypted1 = encrypt(plainText);

            // Second encryption should use cached key
            const encrypted2 = encrypt(plainText);

            // Both should decrypt successfully
            expect(decrypt(encrypted1)).toBe(plainText);
            expect(decrypt(encrypted2)).toBe(plainText);
        });
    });
});
