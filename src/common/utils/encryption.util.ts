import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Cache the encryption key
let cachedEncryptionKey: Buffer | null = null;

/**
 * Get or create encryption key from environment variable
 * The key is cached after first use
 */
function getKey(): Buffer {
    if (!cachedEncryptionKey) {
        const key =
            process.env.CALENDAR_ENCRYPTION_KEY ||
            'default-encryption-key-please-change-in-production';

        // Create a 32-byte key from the string
        cachedEncryptionKey = crypto.scryptSync(key, 'salt', 32);
    }
    return cachedEncryptionKey;
}

/**
 * Encrypt a string value using AES-256-GCM
 * @param text Plain text to encrypt
 * @returns Encrypted text in format: iv:authTag:encryptedData (all hex encoded)
 */
export function encrypt(text: string): string {
    if (!text) {
        throw new Error('Cannot encrypt empty text');
    }

    const encryptionKey = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, encryptionKey, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Return iv:authTag:encrypted (all in hex)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string
 * @param encryptedText Encrypted text in format: iv:authTag:encryptedData
 * @returns Decrypted plain text
 */
export function decrypt(encryptedText: string): string {
    if (!encryptedText) {
        throw new Error('Cannot decrypt empty text');
    }

    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const [ivHex, authTagHex, encrypted] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const encryptionKey = getKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, encryptionKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Safely decrypt, returning null if decryption fails
 * @param encryptedText Encrypted text
 * @returns Decrypted text or null if failed
 */
export function safeDecrypt(encryptedText: string): string | null {
    try {
        return decrypt(encryptedText);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Decryption failed:', errorMessage);
        return null;
    }
}
