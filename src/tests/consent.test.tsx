import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { ConsentProvider, useConsent } from '../contexts/ConsentContext';
import { hasUserConsented } from '../lib/telemetry';
import { AnalyticsService } from '../services/analyticsService';

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

  it('nao deve persistir logs de busca no AnalyticsService sem consentimento', () => {
    AnalyticsService.logSearch('termo sem consentimento', 1);
    const logs = JSON.parse(localStorage.getItem('sst_search_analytics_logs') || '[]');
    expect(logs.length).toBe(0);
  });

  it('deve persistir logs de busca no AnalyticsService apos consentimento concedido', () => {
    localStorage.setItem('sst_user_cookie_consent', 'granted');
    AnalyticsService.logSearch('termo com consentimento', 3);
    const logs = JSON.parse(localStorage.getItem('sst_search_analytics_logs') || '[]');
    expect(logs.length).toBe(1);
    expect(logs[0].query).toBe('termo com consentimento');
  });
});
