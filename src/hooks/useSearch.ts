import { useMemo } from 'react';
import Fuse from 'fuse.js';

interface UseSearchOptions<T> {
    keys: string[];
    threshold?: number;
}

export function useSearch<T>(data: T[], query: string, options: UseSearchOptions<T>) {
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
        if (!query) return data;

        // fuse.search returns { item: T, score: number }[]
        // We map back to T[]
        return fuse.search(query).map(result => result.item);
    }, [fuse, query, data]);

    return results;
}
