"use client";
import { useCallback, useRef, useSyncExternalStore } from 'react';

/**
 * Lê um valor que só existe no navegador (ex.: localStorage) sem quebrar a hidratação.
 *
 * Na renderização do servidor e na hidratação, o React usa `serverValue` — o mesmo HTML
 * dos dois lados. Logo depois, troca pelo valor real do navegador. Ler o storage direto
 * na renderização (ex.: useMemo) gera HTML diferente no servidor e no cliente (erro #418).
 *
 * O valor é lido uma vez e só relido quando o storage muda em outra aba (evento
 * `storage`): leituras que não são determinísticas (ex.: dados de demonstração com
 * Date.now()) não podem virar "mudanças" a cada renderização.
 * `read` e `serverValue` devem ser estáveis (definidos fora do componente).
 */
export function useBrowserSnapshot<T>(read: () => T, serverValue: T): T {
  const cache = useRef<{ value: T } | null>(null);

  const subscribe = useCallback((onChange: () => void) => {
    const handler = () => {
      cache.current = null;
      onChange();
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const getSnapshot = useCallback(() => {
    if (!cache.current) cache.current = { value: read() };
    return cache.current.value;
  }, [read]);

  const getServerSnapshot = useCallback(() => serverValue, [serverValue]);
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
