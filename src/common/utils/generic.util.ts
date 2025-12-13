export function mapArray<T, R>(
    items: T[] | null | undefined,
    mapper: (item: T) => R,
): R[] | undefined {
    return Array.isArray(items) ? items.map(mapper) : undefined;
}
