import { useMemo, useDeferredValue } from 'react';
import MiniSearch from 'minisearch';

interface UseSearchOptions<T> {
    keys: string[];
    threshold?: number;
}

export function useSearch<T extends Record<string, any>>(
    data: T[],
    query: string,
    options: UseSearchOptions<T>
): T[] {
    // Mantém digitação suave sem travar o event loop
    const deferredQuery = useDeferredValue(query);

    // Constrói e indexa os documentos no MiniSearch
    const miniSearch = useMemo(() => {
        const ms = new MiniSearch<T>({
            fields: options.keys,
            storeFields: ['id'],
            idField: 'id',
            // Tokenização otimizada para português e pontuação
            tokenize: (string) => string.toLowerCase().split(/[\s,./\\-_;:!?()\[\]"']+/).filter(Boolean),
            searchOptions: {
                boost: {
                    question: 3,
                    category: 2,
                    tags: 2,
                    searchText: 1,
                    answer: 1
                },
                prefix: true, // Busca por prefixo (ex: 'cat' encontra 'cat' e termos prefixados)
                fuzzy: (term) => (term.length > 2 ? 0.3 : false), // Tolerância proporcional ao tamanho do termo
                combineWith: 'OR'
            }
        });

        // Garante que cada item tenha um id único para indexação
        const indexedData = data.map((item, index) => ({
            ...item,
            id: item.id !== undefined && item.id !== null ? String(item.id) : `item-${index}`
        }));

        ms.addAll(indexedData);
        return { engine: ms, idMap: new Map(indexedData.map(item => [item.id, item])) };
    }, [data, options.keys, options.threshold]);

    const results = useMemo(() => {
        const trimmed = deferredQuery?.trim();
        if (!trimmed) return data;

        // 1. Busca rápida indexada no MiniSearch
        const searchHits = miniSearch.engine.search(trimmed);
        const hitIds = new Set(searchHits.map(hit => hit.id));
        const matchedItems: T[] = searchHits
            .map(hit => miniSearch.idMap.get(hit.id))
            .filter((item): item is T => item !== undefined);

        // 2. Substring fallback para acrônimos ou termos contidos em palavras compostas (ex: "CAT" dentro de "LTCAT")
        const lowerQuery = trimmed.toLowerCase();
        for (const item of data) {
            const itemId = (item as any).id !== undefined && (item as any).id !== null ? String((item as any).id) : '';
            if (itemId && !hitIds.has(itemId)) {
                const matchesAnyKey = options.keys.some(key => {
                    const val = item[key];
                    if (typeof val === 'string') {
                        return val.toLowerCase().includes(lowerQuery);
                    }
                    if (Array.isArray(val)) {
                        return val.some(v => typeof v === 'string' && v.toLowerCase().includes(lowerQuery));
                    }
                    return false;
                });

                if (matchesAnyKey) {
                    matchedItems.push(item);
                    hitIds.add(itemId);
                }
            }
        }

        return matchedItems;
    }, [miniSearch, deferredQuery, data, options.keys]);

    return results;
}
