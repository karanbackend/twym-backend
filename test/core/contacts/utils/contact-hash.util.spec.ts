import { ContactHashUtil } from '../../../../src/core/contacts/utils/contact-hash.util';

describe('ContactHashUtil', () => {
    describe('generateHash', () => {
        it('should generate hash from name, email, and phone', () => {
            const hash = ContactHashUtil.generateHash(
                'John Doe',
                'john@example.com',
                '+1-234-567-8900',
            );

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64); // SHA-256 hex
        });

        it('should generate same hash for identical normalized data', () => {
            const hash1 = ContactHashUtil.generateHash(
                'John Doe',
                'john@example.com',
                '+1-234-567-8900',
            );
            const hash2 = ContactHashUtil.generateHash(
                'john doe',
                'JOHN@EXAMPLE.COM',
                '12345678900',
            );

            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different data', () => {
            const hash1 = ContactHashUtil.generateHash(
                'John Doe',
                'john@example.com',
                '+1-234-567-8900',
            );
            const hash2 = ContactHashUtil.generateHash(
                'Jane Smith',
                'jane@example.com',
                '+1-987-654-3210',
            );

            expect(hash1).not.toBe(hash2);
        });

        it('should handle null values', () => {
            const hash = ContactHashUtil.generateHash(null, null, null);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            // Should return random hash when no data available
            expect(hash.length).toBe(32); // random bytes hex
        });

        it('should handle undefined values', () => {
            const hash = ContactHashUtil.generateHash(undefined, undefined, undefined);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
        });

        it('should handle partial data - name only', () => {
            const hash = ContactHashUtil.generateHash('John Doe', null, null);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });

        it('should handle partial data - email only', () => {
            const hash = ContactHashUtil.generateHash(null, 'john@example.com', null);

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });

        it('should handle partial data - phone only', () => {
            const hash = ContactHashUtil.generateHash(null, null, '+1-234-567-8900');

            expect(hash).toBeDefined();
            expect(typeof hash).toBe('string');
            expect(hash.length).toBe(64);
        });

        it('should normalize phone numbers by removing non-digits', () => {
            const hash1 = ContactHashUtil.generateHash(null, null, '+1 (234) 567-8900');
            const hash2 = ContactHashUtil.generateHash(null, null, '12345678900');

            expect(hash1).toBe(hash2);
        });

        it('should normalize emails to lowercase', () => {
            const hash1 = ContactHashUtil.generateHash(null, 'JOHN@EXAMPLE.COM', null);
            const hash2 = ContactHashUtil.generateHash(null, 'john@example.com', null);

            expect(hash1).toBe(hash2);
        });

        it('should normalize names by removing special characters', () => {
            const hash1 = ContactHashUtil.generateHash('John-Paul Doe', null, null);
            const hash2 = ContactHashUtil.generateHash('johnpaul doe', null, null);

            expect(hash1).toBe(hash2);
        });
    });

    describe('calculateSimilarity', () => {
        it('should return 1.0 for identical contacts', () => {
            const contact1 = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-234-567-8900',
            };
            const contact2 = {
                name: 'john doe',
                email: 'JOHN@EXAMPLE.COM',
                phone: '1234567890 0',
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBe(1.0);
        });

        it('should return 0 for completely different contacts', () => {
            const contact1 = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-234-567-8900',
            };
            const contact2 = {
                name: 'Jane Smith',
                email: 'jane@different.com',
                phone: '+1-987-654-3210',
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBe(0);
        });

        it('should return partial similarity for partial matches', () => {
            const contact1 = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1-234-567-8900',
            };
            const contact2 = {
                name: 'John Doe',
                email: 'different@example.com',
                phone: '+1-987-654-3210',
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThan(1);
            expect(similarity).toBeCloseTo(0.333, 1); // 1 out of 3 matches
        });

        it('should handle null/undefined values', () => {
            const contact1 = {
                name: 'John Doe',
                email: null,
                phone: null,
            };
            const contact2 = {
                name: 'John Doe',
                email: null,
                phone: null,
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBe(1.0);
        });

        it('should return 0 when no comparable fields exist', () => {
            const contact1 = {
                name: null,
                email: null,
                phone: null,
            };
            const contact2 = {
                name: null,
                email: null,
                phone: null,
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBe(0);
        });

        it('should give partial credit for name substring matches', () => {
            const contact1 = {
                name: 'John Paul Doe',
                email: null,
                phone: null,
            };
            const contact2 = {
                name: 'John',
                email: null,
                phone: null,
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThan(1);
            expect(similarity).toBe(0.5); // partial name match
        });

        it('should handle email match only', () => {
            const contact1 = {
                name: 'John Doe',
                email: 'john@example.com',
                phone: null,
            };
            const contact2 = {
                name: 'Jane Smith',
                email: 'john@example.com',
                phone: null,
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThan(1);
            expect(similarity).toBe(0.5); // 1 out of 2 comparable fields match
        });

        it('should handle phone match only', () => {
            const contact1 = {
                name: 'John Doe',
                email: null,
                phone: '+1-234-567-8900',
            };
            const contact2 = {
                name: 'Jane Smith',
                email: null,
                phone: '1234567890 0',
            };

            const similarity = ContactHashUtil.calculateSimilarity(contact1, contact2);

            expect(similarity).toBeGreaterThan(0);
            expect(similarity).toBeLessThan(1);
            expect(similarity).toBe(0.5); // 1 out of 2 comparable fields match
        });
    });
});
