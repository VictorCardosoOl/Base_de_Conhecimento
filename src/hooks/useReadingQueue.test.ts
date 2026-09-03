
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReadingQueue } from './useReadingQueue';

describe('useReadingQueue', () => {
  beforeEach(() => {
    // Limpa o localStorage antes de cada teste para garantir isolamento
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve iniciar com uma fila vazia', () => {
    const { result } = renderHook(() => useReadingQueue());
    expect(result.current.queue).toEqual([]);
  });

  it('deve adicionar um item à fila e persistir no localStorage', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('tratativa-protocolo');
    });
    expect(result.current.queue).toContain('tratativa-protocolo');
    
    const saved = JSON.parse(localStorage.getItem('teamwiki_queue') || '[]');
    expect(saved).toContain('tratativa-protocolo');
  });

  it('deve remover um item da fila', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('artigo-1');
      result.current.removeFromQueue('artigo-1');
    });
    expect(result.current.queue).not.toContain('artigo-1');
  });

  it('deve alternar (toggle) o estado de um item na fila', () => {
    const { result } = renderHook(() => useReadingQueue());
    
    // Primeiro toggle: adiciona
    act(() => {
      result.current.toggleQueue('configuracao-vpn');
    });
    expect(result.current.queue).toContain('configuracao-vpn');
    
    // Segundo toggle: remove
    act(() => {
      result.current.toggleQueue('configuracao-vpn');
    });
    expect(result.current.queue).toEqual([]);
  });

  it('deve reordenar itens na fila (mover para cima e para baixo)', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('item-1');
      result.current.addToQueue('item-2');
      result.current.addToQueue('item-3');
    });
    
    expect(result.current.queue).toEqual(['item-1', 'item-2', 'item-3']);
    
    // Move o item-2 para cima
    act(() => {
      result.current.moveItem('item-2', 'UP');
    });
    expect(result.current.queue).toEqual(['item-2', 'item-1', 'item-3']);

    // Move o item-2 para baixo
    act(() => {
      result.current.moveItem('item-2', 'DOWN');
    });
    expect(result.current.queue).toEqual(['item-1', 'item-2', 'item-3']);
  });

  it('não deve permitir duplicatas na fila via addToQueue', () => {
    const { result } = renderHook(() => useReadingQueue());
    act(() => {
      result.current.addToQueue('item-unico');
      result.current.addToQueue('item-unico');
    });
    expect(result.current.queue).toHaveLength(1);
  });
});
