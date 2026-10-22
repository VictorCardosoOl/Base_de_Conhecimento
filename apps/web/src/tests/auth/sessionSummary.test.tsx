import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createLocalJWKSet } from 'jose';
import { summarizeSession } from '@/features/auth/session-summary';
import type { AuthConfig } from '@/features/auth/config';
import { AUDIENCE, ISSUER, USER_ID, makeKey, signToken, type TestKey } from './keys';

const client = vi.hoisted(() => ({ refreshSession: vi.fn(async () => true) }));
vi.mock('@/features/auth/client', () => client);

import { useSessionSummary } from '@/features/auth/use-session-summary';
import { isAuthReturnLoop, markAuthReturn } from '@/features/auth/return-guard';

const CONFIG: AuthConfig = {
  internalUrl: 'http://auth.internal:8010',
  issuer: ISSUER,
  audience: AUDIENCE,
  accessCookieName: 'kb_at',
  jwksUrl: 'http://auth.internal:8010/.well-known/jwks.json',
};

let key: TestKey;
beforeAll(async () => {
  key = await makeKey('kid-atual');
});

function deps(token: string | undefined, me: Response | Error) {
  return {
    config: CONFIG,
    keySet: createLocalJWKSet({ keys: [key.jwk] }),
    readAccessToken: async () => token,
    fetchImpl: vi.fn(async () => {
      if (me instanceof Error) throw me;
      return me;
    }) as unknown as typeof fetch,
  };
}

const me = (role: string, status = 200) =>
  new Response(JSON.stringify({
      id: USER_ID,
      email: 'x@y.com',
      username: 'pessoa.x',
      display_name: 'Pessoa X',
      role,
      must_change_password: false,
    }), { status });

describe('summarizeSession (GET /api/session)', () => {
  it('sem sessão, token inválido ou revogado → não autenticado', async () => {
    expect(await summarizeSession(deps(undefined, me('user')))).toEqual({ authenticated: false });
    expect(await summarizeSession(deps('lixo', me('user')))).toEqual({ authenticated: false });
    const token = await signToken(key);
    expect(await summarizeSession(deps(token, me('user', 401)))).toEqual({ authenticated: false });
  });

  it('expirado → avisa para o cliente renovar', async () => {
    const expired = await signToken(key, { expiresIn: Math.floor(Date.now() / 1000) - 60 });
    expect(await summarizeSession(deps(expired, me('user')))).toEqual({ authenticated: false, expired: true });
  });

  it('válido → identificação e papel atual do AuthService, nunca o token', async () => {
    const token = await signToken(key, { role: 'admin' });
    const summary = await summarizeSession(deps(token, me('editor')));
    expect(summary).toEqual({
      authenticated: true,
      email: 'x@y.com',
      username: 'pessoa.x',
      displayName: 'Pessoa X',
      role: 'editor',
      mustChangePassword: false,
    });
    expect(JSON.stringify(summary)).not.toContain(token);
  });

  it('AuthService fora → não autenticado (a navegação não quebra)', async () => {
    const token = await signToken(key);
    expect(await summarizeSession(deps(token, new TypeError('fetch failed')))).toEqual({ authenticated: false });
  });
});

function Probe() {
  const summary = useSessionSummary();
  return <p>{summary === null ? 'carregando' : summary.authenticated ? 'autenticado' : 'anônimo'}</p>;
}

describe('useSessionSummary', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it('access expirado: renova uma vez e consulta de novo', async () => {
    const responses = [
      { authenticated: false, expired: true },
      {
        authenticated: true,
        email: 'x@y.com',
        username: 'pessoa.x',
        displayName: 'Pessoa X',
        role: 'user',
        mustChangePassword: false,
      },
    ];
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(responses.shift())));
    vi.stubGlobal('fetch', fetchMock);
    render(<Probe />);
    await waitFor(() => expect(screen.getByText('autenticado')).toBeTruthy());
    expect(client.refreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('anônimo não tenta renovar', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ authenticated: false }))));
    render(<Probe />);
    await waitFor(() => expect(screen.getByText('anônimo')).toBeTruthy());
    expect(client.refreshSession).not.toHaveBeenCalled();
  });
});

// D2 (2026-10-15): a marca de "volta ao destino" (proteção contra loop login ↔ destino)
// sobrava depois de um login normal. Voltar ao mesmo destino pelo login em menos de 15 s
// (ex.: access vencido) era tratado como loop e a pessoa ficava presa no login.
describe('useSessionSummary e a proteção contra loop', () => {
  const AUTHENTICATED = {
    authenticated: true,
    email: 'x@y.com',
    username: 'pessoa.x',
    displayName: 'Pessoa X',
    role: 'user',
    mustChangePassword: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    window.history.replaceState(null, '', '/');
  });

  async function openAt(path: string, summary: object) {
    window.history.replaceState(null, '', path);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(summary))));
    render(<Probe />);
    await waitFor(() => expect(screen.queryByText('carregando')).toBeNull());
  }

  it('o destino abriu com sessão válida: a marca sai e a próxima volta não é loop', async () => {
    markAuthReturn('/conta');
    await openAt('/conta', AUTHENTICATED);
    expect(isAuthReturnLoop('/conta')).toBe(false);
  });

  it('loop real (o destino nunca abre: o servidor manda de volta ao login) continua detectado', async () => {
    markAuthReturn('/conta');
    // O layout também roda no próprio /login: ali a marca não pode sair.
    await openAt('/login?next=%2Fconta', AUTHENTICATED);
    expect(isAuthReturnLoop('/conta')).toBe(true);
  });

  it('sem sessão válida no destino, ou em outro destino, a marca continua', async () => {
    markAuthReturn('/conta');
    await openAt('/conta', { authenticated: false });
    expect(isAuthReturnLoop('/conta')).toBe(true);
    await openAt('/minha-lista', AUTHENTICATED);
    expect(isAuthReturnLoop('/conta')).toBe(true);
  });
});
