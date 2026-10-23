import { useMemo, useDeferredValue } from 'react';
import MiniSearch from 'minisearch';

interface UseSearchOptions {
  keys: string[];
  threshold?: number;
}

export function useSearch<T extends object>(
  data: T[],
  query: string,
  options: UseSearchOptions
): T[] {
  // Mantém digitação suave sem travar o event loop
  const deferredQuery = useDeferredValue(query);
  const trimmed = deferredQuery?.trim();

  // Constrói e indexa os documentos no MiniSearch com memoização estável
  const miniSearch = useMemo(() => {
    const ms = new MiniSearch<T>({
      fields: options.keys,
      storeFields: ['id'],
      idField: 'id',
      // Tokenização otimizada para português e pontuação
      tokenize: (str) =>
        str
          .toLowerCase()
          .split(/[\s,./\\-_;:!?()[\]"']+/)
          .filter(Boolean),
      searchOptions: {
        boost: {
          question: 3,
          category: 2,
          tags: 2,
          searchText: 1,
          answer: 1,
        },
        prefix: true,
        fuzzy: (term) => (term.length > 2 ? 0.3 : false),
        combineWith: 'OR',
      },
    });

    const indexedData = data.map((item, index) => {
      const record = item as Record<string, unknown>;
      return {
        ...item,
        id: record.id !== undefined && record.id !== null ? String(record.id) : `item-${index}`,
      };
    });

    ms.addAll(indexedData);
    return {
      engine: ms,
      idMap: new Map(indexedData.map((item) => [item.id, item])),
    };
  }, [data, options.keys]);

  const results = useMemo(() => {
    // Guard clause: termo vazio retorna lista completa imediatamente
    if (!trimmed) return data;

    // 1. Busca rápida indexada no MiniSearch
    const searchHits = miniSearch.engine.search(trimmed);
    const hitIds = new Set(searchHits.map((hit) => hit.id));
    const matchedItems: T[] = searchHits
      .map((hit) => miniSearch.idMap.get(hit.id) as T | undefined)
      .filter((item): item is T => item !== undefined);

    // Se a busca indexada já retornou resultados ou o termo for muito curto, evitamos varredura completa cara
    if (matchedItems.length >= 5 || trimmed.length < 3) {
      return matchedItems;
    }

    // 2. Substring fallback sob demanda apenas se a busca indexada retornar poucos resultados
    const lowerQuery = trimmed.toLowerCase();

    const fallbackItems = data.filter((item) => {
      const record = item as Record<string, unknown>;
      const itemId = record.id !== undefined && record.id !== null ? String(record.id) : '';

      // Guard clause: se já foi encontrado pelo MiniSearch, pula
      if (itemId && hitIds.has(itemId)) return false;

      return options.keys.some((key) => {
        const val = record[key];
        if (typeof val === 'string') {
          return val.toLowerCase().includes(lowerQuery);
        }
        if (Array.isArray(val)) {
          return val.some((v) => typeof v === 'string' && v.toLowerCase().includes(lowerQuery));
        }
        return false;
      });
    });

    return [...matchedItems, ...fallbackItems];
  }, [miniSearch, trimmed, data, options.keys]);

  return results;
}
