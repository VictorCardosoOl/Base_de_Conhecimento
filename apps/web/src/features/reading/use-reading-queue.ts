import { useSyncExternalStore } from 'react';

/**
 * Lista de leitura ("Minha Lista") guardada no navegador.
 *
 * Estado único para a página inteira: o contador do menu, os botões dos cards e a página
 * /minha-lista enxergam a mesma lista na hora (antes, cada uso do hook tinha a sua cópia
 * e o menu só se atualizava ao recarregar). Também acompanha mudanças feitas em outra aba
 * (evento `storage`). Na renderização do servidor e na hidratação, a lista é vazia — o
 * mesmo HTML dos dois lados; logo depois aparece a lista salva.
 */

const STORAGE_KEY = 'sstfaq_queue';
const LEGACY_KEY = 'teamwiki_queue';
const EMPTY: string[] = [];

let current: string[] | null = null;
const listeners = new Set<() => void>();

function parse(raw: string | null): string[] {
  if (!raw) return EMPTY;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value)
      ? value.filter((id): id is string => typeof id === 'string')
      : EMPTY;
  } catch (error) {
    console.error('Erro ao carregar fila', error);
    return EMPTY;
  }
}

function load(): string[] {
  try {
    // Migração da chave antiga (nome anterior do projeto).
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy !== null) {
      localStorage.setItem(STORAGE_KEY, legacy);
      localStorage.removeItem(LEGACY_KEY);
    }
    return parse(localStorage.getItem(STORAGE_KEY));
  } catch {
    return EMPTY;
  }
}

function getSnapshot(): string[] {
  if (current === null) current = load();
  return current;
}

function getServerSnapshot(): string[] {
  return EMPTY;
}

function notify() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  // Primeiro interessado: relê do storage (pode ter mudado enquanto ninguém observava).
  if (listeners.size === 0) current = null;
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY || event.key === null) {
      current = null;
      listener();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener('storage', onStorage);
  };
}

function update(change: (queue: string[]) => string[]) {
  const previous = getSnapshot();
  const next = change(previous);
  if (next === previous) return;
  current = next;
  notify();
  // Grava fora do ciclo de renderização (evita travar animações em andamento).
  setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (error) {
      console.error('Falha ao persistir fila:', error);
    }
  }, 0);
}

export const useReadingQueue = () => {
  const queue = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addToQueue = (id: string) =>
    update((prev) => (prev.includes(id) ? prev : [...prev, id]));

  const removeFromQueue = (id: string) =>
    update((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : prev
    );

  const toggleQueue = (id: string) =>
    update((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );

  const moveItem = (id: string, direction: 'UP' | 'DOWN') =>
    update((prev) => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);
      return next;
    });

  return { queue, addToQueue, removeFromQueue, toggleQueue, moveItem };
};
