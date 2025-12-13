import { BadRequestException } from '@nestjs/common';

/**
 * Stateless utility functions for profile operations
 */
export class ProfileUtil {
    /**
     * Generates a base handle from a name
     * Converts to lowercase and replaces spaces/special chars with hyphens
     *
     * @param name - The name to convert to a handle
     * @returns The normalized handle string
     * @throws BadRequestException if the name cannot generate a valid handle
     *
     * @example
     * ProfileUtil.generateBaseHandle('John Doe') // returns 'john-doe'
     * ProfileUtil.generateBaseHandle('María García-López') // returns 'maria-garcia-lopez'
     */
    static generateBaseHandle(name: string): string {
        if (!name) {
            throw new BadRequestException('Name must be a non-empty string');
        }

        const baseHandle = name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens

        if (!baseHandle) {
            throw new BadRequestException('Invalid name for profile handle generation');
        }

        return baseHandle;
    }

    /**
     * Generates a handle with a random numeric suffix
     *
     * @param baseHandle - The base handle to append suffix to
     * @param suffixLength - Length of the numeric suffix (default: 4)
     * @returns Handle with random suffix (e.g., 'john-doe-3847')
     *
     * @example
     * ProfileUtil.generateHandleWithSuffix('john-doe') // returns 'john-doe-3847'
     * ProfileUtil.generateHandleWithSuffix('john-doe', 6) // returns 'john-doe-482736'
     */
    static generateHandleWithSuffix(baseHandle: string, suffixLength: number = 4): string {
        const maxNumber = Math.pow(10, suffixLength);
        const randomSuffix = Math.floor(Math.random() * maxNumber)
            .toString()
            .padStart(suffixLength, '0');

        return `${baseHandle}-${randomSuffix}`;
    }
}
