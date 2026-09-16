import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useReadingQueue } from '../../hooks/use-reading-queue';

describe('useReadingQueue Hook (State & Persistence Logic)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
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
    expect(JSON.parse(localStorage.getItem('sstfaq_queue') || '[]')).toEqual(['artigo-s2240']);
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
});
