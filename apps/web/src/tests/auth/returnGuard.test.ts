import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  RETURN_LOOP_WINDOW_MS,
  clearAuthReturn,
  isAuthReturnLoop,
  markAuthReturn,
} from '@/features/auth/return-guard';

describe('returnGuard', () => {
  beforeEach(() => sessionStorage.clear());

  it('sem marca não há loop', () => {
    expect(isAuthReturnLoop('/admin')).toBe(false);
  });

  it('mesma volta dentro da janela é loop; fora da janela ou outro destino, não', () => {
    markAuthReturn('/admin', 1_000);
    expect(isAuthReturnLoop('/admin', 1_000 + RETURN_LOOP_WINDOW_MS - 1)).toBe(true);
    expect(isAuthReturnLoop('/admin', 1_000 + RETURN_LOOP_WINDOW_MS)).toBe(false);
    expect(isAuthReturnLoop('/admin/editor', 1_001)).toBe(false);
    expect(isAuthReturnLoop('/admin', 999)).toBe(false);
  });

  it('guarda só destino e horário (nenhum dado de sessão)', () => {
    markAuthReturn('/admin', 42);
    expect(JSON.parse(sessionStorage.getItem('kb:auth-return')!)).toEqual({ next: '/admin', at: 42 });
  });

  it('clear remove a marca; conteúdo corrompido não é loop', () => {
    markAuthReturn('/admin');
    clearAuthReturn();
    expect(isAuthReturnLoop('/admin')).toBe(false);
    sessionStorage.setItem('kb:auth-return', '{nao-json');
    expect(isAuthReturnLoop('/admin')).toBe(false);
  });

  it('storage indisponível não quebra o fluxo', () => {
    const spy = vi.spyOn(window, 'sessionStorage', 'get').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(() => markAuthReturn('/admin')).not.toThrow();
    expect(isAuthReturnLoop('/admin')).toBe(false);
    expect(() => clearAuthReturn()).not.toThrow();
    spy.mockRestore();
  });
});
