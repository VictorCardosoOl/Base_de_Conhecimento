import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useSearch } from './useSearch';

interface MockItem {
  id: string;
  question: string;
  category: string;
  tags: string[];
}

const mockData: MockItem[] = [
  { id: '1', question: 'Como emitir CAT?', category: 'eSocial', tags: ['Acidente', 'Trabalho'] },
  { id: '2', question: 'O que é LTCAT?', category: 'Previdência', tags: ['Laudo', 'Insalubridade'] },
  { id: '3', question: 'Evento S-2240', category: 'eSocial', tags: ['Fatores de Risco'] },
  { id: '4', question: 'Configuração da VPN', category: 'Tecnologia', tags: ['Rede', 'Acesso'] },
];

describe('useSearch Hook (Fuzzy Search Domain Logic)', () => {
  it('deve retornar todos os itens quando a query estiver vazia', () => {
    const { result } = renderHook(() =>
      useSearch(mockData, '', { keys: ['question', 'category', 'tags'] })
    );
    expect(result.current).toHaveLength(mockData.length);
    expect(result.current).toEqual(mockData);
  });

  it('deve encontrar itens por correspondência exata ou aproximada (fuzzy match)', () => {
    const { result } = renderHook(() =>
      useSearch(mockData, 'CAT', { keys: ['question', 'category'] })
    );
    // Deve encontrar 'Como emitir CAT?' e 'O que é LTCAT?'
    expect(result.current.some(item => item.id === '1')).toBe(true);
    expect(result.current.some(item => item.id === '2')).toBe(true);
  });

  it('deve encontrar itens pesquisando por tags secundárias', () => {
    const { result } = renderHook(() =>
      useSearch(mockData, 'Insalubridade', { keys: ['tags'] })
    );
    expect(result.current).toHaveLength(1);
    expect(result.current[0].id).toBe('2');
  });

  it('deve retornar array vazio quando nenhuma correspondência for encontrada', () => {
    const { result } = renderHook(() =>
      useSearch(mockData, 'TermoInexistente999', { keys: ['question', 'category'] })
    );
    expect(result.current).toHaveLength(0);
  });
});
