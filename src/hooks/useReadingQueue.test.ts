import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReadingQueue } from './useReadingQueue';

describe('useReadingQueue Hook (State & Persistence Logic)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('deve inicializar com fila vazia quando não há dados no localStorage', () => {
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual([]);
  });

  it('deve adicionar novos itens à fila e persistir no localStorage', () => {
    const { result } = renderHook(() => useReadingQueue());

    act(() => {
      result.current.addToQueue('artigo-s2240');
    });

    expect(result.current.queue).toContain('artigo-s2240');
    expect(JSON.parse(localStorage.getItem('sstfaq_queue') || '[]')).toEqual(['artigo-s2240']);
  });

  it('não deve permitir itens duplicados na fila', () => {
    const { result } = renderHook(() => useReadingQueue());

    act(() => {
      result.current.addToQueue('artigo-s2240');
      result.current.addToQueue('artigo-s2240');
    });

    expect(result.current.queue).toEqual(['artigo-s2240']);
  });

  it('deve alternar presença do item (toggleQueue)', () => {
    const { result } = renderHook(() => useReadingQueue());

    act(() => {
      result.current.toggleQueue('artigo-cat');
    });
    expect(result.current.queue).toContain('artigo-cat');

    act(() => {
      result.current.toggleQueue('artigo-cat');
    });
    expect(result.current.queue).not.toContain('artigo-cat');
  });

  it('deve reordenar itens corretamente com moveItem UP e DOWN', () => {
    const { result } = renderHook(() => useReadingQueue());

    act(() => {
      result.current.addToQueue('item-1');
      result.current.addToQueue('item-2');
      result.current.addToQueue('item-3');
    });

    expect(result.current.queue).toEqual(['item-1', 'item-2', 'item-3']);

    // Mover item-2 para cima (UP)
    act(() => {
      result.current.moveItem('item-2', 'UP');
    });
    expect(result.current.queue).toEqual(['item-2', 'item-1', 'item-3']);

    // Mover item-2 para baixo (DOWN)
    act(() => {
      result.current.moveItem('item-2', 'DOWN');
    });
    expect(result.current.queue).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('deve migrar a chave legada teamwiki_queue de forma resiliente', () => {
    localStorage.setItem('teamwiki_queue', JSON.stringify(['legado-1', 'legado-2']));

    const { result } = renderHook(() => useReadingQueue());

    expect(result.current.queue).toEqual(['legado-1', 'legado-2']);
    expect(localStorage.getItem('teamwiki_queue')).toBeNull();
    expect(JSON.parse(localStorage.getItem('sstfaq_queue') || '[]')).toEqual(['legado-1', 'legado-2']);
  });

  it('deve tratar exceção graciosamente quando localStorage.setItem lançar erro (ex: cota excedida)', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });

    const { result } = renderHook(() => useReadingQueue());

    // Não deve quebrar a aplicação React
    expect(() => {
      act(() => {
        result.current.addToQueue('artigo-teste');
      });
    }).not.toThrow();

    expect(consoleSpy).toHaveBeenCalled();
  });
});
