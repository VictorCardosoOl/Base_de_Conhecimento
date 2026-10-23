"use client";
import { createContext, useContext, useEffect, useState } from 'react';
import { refreshSession } from './client';
import { settleAuthReturn } from './return-guard';

export type ClientSessionSummary =
  | {
      authenticated: true;
      email: string;
      username: string;
      displayName: string;
      role: string;
      mustChangePassword: boolean;
    }
  | { authenticated: false; expired?: boolean };

function isClientSessionSummary(data: unknown): data is ClientSessionSummary {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (d.authenticated === true) {
    return typeof d.email === 'string' && typeof d.username === 'string';
  }
  return d.authenticated === false;
}

async function fetchSummary(): Promise<ClientSessionSummary> {
  const response = await fetch('/api/session', { credentials: 'same-origin', cache: 'no-store' });
  if (!response.ok) return { authenticated: false };
  const data = await response.json();
  return isClientSessionSummary(data) ? data : { authenticated: false };
}

/**
 * Estado da sessão só para navegação (ex.: mostrar "Minha conta"). Não é autorização.
 * Access expirado com sessão ainda válida: renova uma vez e consulta de novo.
 */
export function useSessionSummary(): ClientSessionSummary | null {
  const [summary, setSummary] = useState<ClientSessionSummary | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let current = await fetchSummary();
        if (!current.authenticated && current.expired && (await refreshSession())) {
          current = await fetchSummary();
        }
        // Destino aberto com sessão: a volta pelo login terminou (proteção contra loop).
        if (current.authenticated) settleAuthReturn(window.location.pathname + window.location.search);
        if (active) setSummary(current);
      } catch {
        if (active) setSummary({ authenticated: false });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return summary;
}

/**
 * A consulta feita pelo layout, compartilhada com as páginas (artigo, comentários...):
 * uma requisição por carregamento. null enquanto carrega. Não é autorização.
 */
export const SessionSummaryContext = createContext<ClientSessionSummary | null>(null);

export function useCurrentSession(): ClientSessionSummary | null {
  return useContext(SessionSummaryContext);
}
