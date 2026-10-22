import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ConsentProvider, useConsent } from '@/features/consent/ConsentContext';
import { hasUserConsented } from '@/features/consent/consent-storage';

describe('LGPD Consent Gate & Privacy by Default', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('deve iniciar com status pending e hasConsented como false por padrao (Privacy by Default)', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConsentProvider>{children}</ConsentProvider>
    );
    const { result } = renderHook(() => useConsent(), { wrapper });

    expect(result.current.consent).toBe('pending');
    expect(result.current.hasConsented).toBe(false);
    expect(hasUserConsented()).toBe(false);
  });

  it('deve conceder consentimento e persistir em storage ao chamar acceptAll', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConsentProvider>{children}</ConsentProvider>
    );
    const { result } = renderHook(() => useConsent(), { wrapper });

    act(() => {
      result.current.acceptAll();
    });

    expect(result.current.consent).toBe('granted');
    expect(result.current.hasConsented).toBe(true);
    expect(localStorage.getItem('sst_user_cookie_consent')).toBe('granted');
    expect(hasUserConsented()).toBe(true);
  });

  it('deve recusar consentimento ao chamar rejectAll mantendo servicos bloqueados', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConsentProvider>{children}</ConsentProvider>
    );
    const { result } = renderHook(() => useConsent(), { wrapper });

    act(() => {
      result.current.rejectAll();
    });

    expect(result.current.consent).toBe('denied');
    expect(result.current.hasConsented).toBe(false);
    expect(hasUserConsented()).toBe(false);
  });

  it('apaga dados de recursos desativados (registro antigo de buscas) ao carregar', () => {
    localStorage.setItem('sst_search_analytics_logs', '[{"query":"x"}]');
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConsentProvider>{children}</ConsentProvider>
    );
    renderHook(() => useConsent(), { wrapper });
    expect(localStorage.getItem('sst_search_analytics_logs')).toBeNull();
  });

  it('apagar a escolha volta ao estado pendente e avisa o restante da página', () => {
    const listener = vi.fn();
    window.addEventListener('sst_consent_updated', listener);
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ConsentProvider>{children}</ConsentProvider>
    );
    const { result } = renderHook(() => useConsent(), { wrapper });
    act(() => result.current.acceptAll());
    act(() => result.current.resetConsent());
    expect(result.current.consent).toBe('pending');
    expect(localStorage.getItem('sst_user_cookie_consent')).toBeNull();
    expect(listener).toHaveBeenCalledTimes(2);
    window.removeEventListener('sst_consent_updated', listener);
  });
});
