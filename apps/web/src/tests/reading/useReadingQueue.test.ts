import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useReadingQueue } from '@/features/reading/use-reading-queue';

describe('useReadingQueue Hook (State & Persistence Logic)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks(); // desfaz o setItem que falha, usado num dos testes
  });

  it('deve inicializar com fila vazia', () => {
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual([]);
  });

  it('deve adicionar novos itens à fila', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('artigo-s2240');
      vi.runAllTimers();
    });
    expect(result.current.queue).toContain('artigo-s2240');
    expect(JSON.parse(localStorage.getItem('sstfaq_queue') || '[]')).toEqual([
      'artigo-s2240',
    ]);
  });

  it('não deve permitir itens duplicados na fila', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('artigo-s2240');
      result.current.addToQueue('artigo-s2240');
      vi.runAllTimers();
    });
    expect(result.current.queue).toEqual(['artigo-s2240']);
  });

  it('deve remover itens e alternar presença na fila', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('a');
      result.current.addToQueue('b');
      result.current.removeFromQueue('a');
      result.current.toggleQueue('c');
      result.current.toggleQueue('b');
    });
    // A persistência é agendada dentro dos updaters do setState; só drena após o render.
    act(() => {
      vi.runAllTimers();
    });
    expect(result.current.queue).toEqual(['c']);
    expect(JSON.parse(localStorage.getItem('sstfaq_queue') || '[]')).toEqual(['c']);
  });

  it('deve reordenar itens e ignorar movimentos fora dos limites', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      ['a', 'b', 'c'].forEach(id => result.current.addToQueue(id));
    });
    act(() => {
      result.current.moveItem('c', 'UP');
      result.current.moveItem('a', 'UP');
      result.current.moveItem('a', 'DOWN');
      result.current.moveItem('inexistente', 'DOWN');
      vi.runAllTimers();
    });
    expect(result.current.queue).toEqual(['c', 'a', 'b']);
  });

  it('deve migrar a fila legada (teamwiki_queue) para a chave atual', () => {
    localStorage.setItem('teamwiki_queue', JSON.stringify(['legado']));
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual(['legado']);
    expect(localStorage.getItem('teamwiki_queue')).toBeNull();
    expect(JSON.parse(localStorage.getItem('sstfaq_queue') || '[]')).toEqual(['legado']);
  });

  it('deve ignorar JSON corrompido no armazenamento', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.setItem('sstfaq_queue', '{corrompido');
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('deve tratar exceção graciosamente quando localStorage.setItem lançar erro', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useReadingQueue());

    expect(() => {
      act(() => {
        result.current.addToQueue('artigo-erro');
        vi.runAllTimers();
      });
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
  });

  it('menu e cards compartilham a mesma lista (antes, o contador do menu ficava desatualizado)', () => {
    const menu = renderHook(() => useReadingQueue());
    const cards = renderHook(() => useReadingQueue());
    act(() => {
      cards.result.current.toggleQueue('artigo-1');
    });
    expect(menu.result.current.queue).toEqual(['artigo-1']);
    act(() => {
      menu.result.current.removeFromQueue('artigo-1');
    });
    expect(cards.result.current.queue).toEqual([]);
  });

  it('acompanha mudanças feitas em outra aba', () => {
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual([]);
    localStorage.setItem('sstfaq_queue', JSON.stringify(['de-outra-aba']));
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'sstfaq_queue' }));
    });
    expect(result.current.queue).toEqual(['de-outra-aba']);
  });

  it('ignora itens que não são texto no armazenamento', () => {
    localStorage.setItem('sstfaq_queue', JSON.stringify(['ok', 42, null]));
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual(['ok']);
  });
});

