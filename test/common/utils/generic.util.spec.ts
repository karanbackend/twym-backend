import { mapArray } from '../../../src/common/utils/generic.util';

describe('generic.util', () => {
    describe('mapArray', () => {
        it('should map array of items using provided mapper function', () => {
            const items = [1, 2, 3, 4];
            const mapper = (n: number) => n * 2;

            const result = mapArray(items, mapper);

            expect(result).toEqual([2, 4, 6, 8]);
        });

        it('should handle empty array', () => {
            const items: number[] = [];
            const mapper = (n: number) => n * 2;

            const result = mapArray(items, mapper);

            expect(result).toEqual([]);
        });

        it('should return undefined for null input', () => {
            const items = null;
            const mapper = (n: number) => n * 2;

            const result = mapArray(items, mapper);

            expect(result).toBeUndefined();
        });

        it('should return undefined for undefined input', () => {
            const items = undefined;
            const mapper = (n: number) => n * 2;

            const result = mapArray(items, mapper);

            expect(result).toBeUndefined();
        });

        it('should work with complex objects', () => {
            const items = [
                { id: 1, name: 'John' },
                { id: 2, name: 'Jane' },
            ];
            const mapper = (item: { id: number; name: string }) => ({
                userId: item.id,
                fullName: item.name.toUpperCase(),
            });

            const result = mapArray(items, mapper);

            expect(result).toEqual([
                { userId: 1, fullName: 'JOHN' },
                { userId: 2, fullName: 'JANE' },
            ]);
        });

        it('should maintain type safety', () => {
            const items = ['a', 'b', 'c'];
            const mapper = (s: string) => s.length;

            const result = mapArray(items, mapper);

            expect(result).toEqual([1, 1, 1]);
        });
    });
});
