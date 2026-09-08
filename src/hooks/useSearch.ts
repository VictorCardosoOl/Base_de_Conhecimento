import { useMemo, useDeferredValue } from 'react';
import Fuse from 'fuse.js';

interface UseSearchOptions<T> {
    keys: string[];
    threshold?: number;
}

export function useSearch<T>(data: T[], query: string, options: UseSearchOptions<T>) {
    // Defer the query so typing remains smooth while search runs in background
    const deferredQuery = useDeferredValue(query);

    const fuse = useMemo(() => {
        return new Fuse(data, {
            includeScore: true,
            threshold: options.threshold || 0.3,
            keys: options.keys,
            ignoreLocation: true, // Search anywhere in the string
            minMatchCharLength: 2,
        });
    }, [data, options.keys, options.threshold]);

    const results = useMemo(() => {
        if (!deferredQuery) return data;

        // fuse.search returns { item: T, score: number }[]
        // We map back to T[]
        return fuse.search(deferredQuery).map(result => result.item);
    }, [fuse, deferredQuery, data]);

    return results;
}
