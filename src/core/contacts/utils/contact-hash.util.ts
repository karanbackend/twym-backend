import * as crypto from 'crypto';

/**
 * Generate a normalized hash for contact duplicate detection.
 * Combines normalized name, email, and phone number.
 */
export class ContactHashUtil {
    static generateHash(
        name?: string | null,
        email?: string | null,
        phone?: string | null,
    ): string {
        const normalized = [
            this.normalizeName(name),
            this.normalizeEmail(email),
            this.normalizePhone(phone),
        ]
            .filter(Boolean)
            .join('|');

        if (!normalized) {
            // Return a random hash if no data available
            return crypto.randomBytes(16).toString('hex');
        }

        return crypto.createHash('sha256').update(normalized).digest('hex');
    }

    private static normalizeName(name?: string | null): string {
        if (!name) return '';
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .trim();
    }

    private static normalizeEmail(email?: string | null): string {
        if (!email) return '';
        return email.toLowerCase().trim();
    }

    private static normalizePhone(phone?: string | null): string {
        if (!phone) return '';
        // Remove all non-numeric characters
        return phone.replace(/\D/g, '');
    }

    /**
     * Calculate similarity score between two contacts (0-1)
     * Used for fuzzy duplicate detection
     */
    static calculateSimilarity(
        contact1: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
        },
        contact2: {
            name?: string | null;
            email?: string | null;
            phone?: string | null;
        },
    ): number {
        let matches = 0;
        let comparisons = 0;

        // Compare normalized values
        if (contact1.email && contact2.email) {
            comparisons++;
            if (this.normalizeEmail(contact1.email) === this.normalizeEmail(contact2.email)) {
                matches++;
            }
        }

        if (contact1.phone && contact2.phone) {
            comparisons++;
            if (this.normalizePhone(contact1.phone) === this.normalizePhone(contact2.phone)) {
                matches++;
            }
        }

        if (contact1.name && contact2.name) {
            comparisons++;
            const name1 = this.normalizeName(contact1.name);
            const name2 = this.normalizeName(contact2.name);
            if (name1 === name2) {
                matches++;
            } else if (name1.includes(name2) || name2.includes(name1)) {
                matches += 0.5; // Partial match
            }
        }

        return comparisons > 0 ? matches / comparisons : 0;
    }
}
