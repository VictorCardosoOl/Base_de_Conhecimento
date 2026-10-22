import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  authFetch,
  changePassword,
  login,
  logout,
  logoutAll,
  refreshSession,
  register,
  requestEditorAccess,
} from '@/features/auth/client';

function json(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

const USER = { id: '351a1fb1-c472-4834-ba49-ba5128e5e974', email: 'user@teste.local', role: 'user' };

function stubFetch(...responses: Array<Response | Error>) {
  const queue = [...responses];
  const fetchMock = vi.fn(async () => {
    const next = queue.shift();
    if (!next) throw new Error('fetch inesperado');
    if (next instanceof Error) throw next;
    return next;
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

afterEach(() => vi.unstubAllGlobals());

describe('login', () => {
  it('envia email/senha para /auth/login na mesma origem e devolve o usuário', async () => {
    const fetchMock = stubFetch(json(200, { user: USER, access_token_expires_at: '2026-09-27T10:00:00Z' }));
    expect(await login('user@teste.local', 'senha')).toEqual({ ok: true, user: USER });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/auth/login');
    expect(init.method).toBe('POST');
    expect(init.credentials).toBe('same-origin');
    expect(JSON.parse(String(init.body))).toEqual({ email: 'user@teste.local', password: 'senha' });
  });

  it('não guarda nada no navegador', async () => {
    stubFetch(json(200, { user: USER, access_token_expires_at: 'x' }));
    await login('user@teste.local', 'senha');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
    expect(document.cookie).toBe('');
  });

  it('mapeia os erros do contrato sem repassar texto do servidor', async () => {
    stubFetch(
      json(401, { error: { code: 'INVALID_CREDENTIALS', message: 'x' } }),
      json(429, { error: { code: 'RATE_LIMITED', message: 'x' } }, { 'Retry-After': '42' }),
      json(429, { error: { code: 'RATE_LIMITED', message: 'x' } }),
      json(400, { error: { code: 'VALIDATION_ERROR', message: 'x' } }),
      json(503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'x' } }),
      new TypeError('fetch failed')
    );
    expect(await login('a@b.c', 'x')).toEqual({ ok: false, reason: 'invalid_credentials' });
    expect(await login('a@b.c', 'x')).toEqual({ ok: false, reason: 'rate_limited', retryAfterSeconds: 42 });
    expect(await login('a@b.c', 'x')).toEqual({ ok: false, reason: 'rate_limited', retryAfterSeconds: null });
    expect(await login('a@b.c', 'x')).toEqual({ ok: false, reason: 'validation' });
    expect(await login('a@b.c', 'x')).toEqual({ ok: false, reason: 'unavailable' });
    expect(await login('a@b.c', 'x')).toEqual({ ok: false, reason: 'unavailable' });
  });
});

describe('refreshSession (um único refresh por aba)', () => {
  it('chamadas simultâneas compartilham uma única requisição', async () => {
    let release!: (response: Response) => void;
    const fetchMock = vi.fn(
      () => new Promise<Response>((resolve) => {
        release = resolve;
      })
    );
    vi.stubGlobal('fetch', fetchMock);

    const calls = [refreshSession(), refreshSession(), refreshSession()];
    release(json(200, { user: USER }));

    expect(await Promise.all(calls)).toEqual([true, true, true]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]).toEqual([
      '/auth/refresh',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    ]);
  });

  it('depois de terminar, uma nova chamada faz nova requisição', async () => {
    const fetchMock = stubFetch(json(200, {}), json(401, { error: { code: 'UNAUTHORIZED' } }));
    expect(await refreshSession()).toBe(true);
    expect(await refreshSession()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('erro de rede conta como sessão não renovada', async () => {
    stubFetch(new TypeError('offline'));
    expect(await refreshSession()).toBe(false);
  });
});

describe('logout', () => {
  it('chama POST /auth/logout; 204 e 401 (sem sessão) contam como encerrada', async () => {
    const fetchMock = stubFetch(new Response(null, { status: 204 }), json(401, { error: { code: 'UNAUTHORIZED' } }));
    expect(await logout()).toBe(true);
    expect(await logout()).toBe(true);
    expect(fetchMock.mock.calls[0]).toEqual([
      '/auth/logout',
      expect.objectContaining({ method: 'POST', credentials: 'same-origin' }),
    ]);
  });

  it('falha de rede, 5xx ou 403 (CSRF) não fingem que a sessão acabou', async () => {
    stubFetch(
      new TypeError('offline'),
      json(503, { error: { code: 'SERVICE_UNAVAILABLE' } }),
      json(403, { error: { code: 'FORBIDDEN' } })
    );
    expect(await logout()).toBe(false);
    expect(await logout()).toBe(false);
    expect(await logout()).toBe(false);
  });
});

describe('logoutAll', () => {
  it('chama POST /auth/logout-all; com o access token vencido, renova e repete uma vez', async () => {
    const fetchMock = stubFetch(
      json(401, { error: { code: 'SESSION_EXPIRED' } }),
      json(200, { user: USER }),
      new Response(null, { status: 204 })
    );
    expect(await logoutAll()).toBe(true);
    expect(fetchMock.mock.calls.map((call) => (call as unknown[])[0])).toEqual(['/auth/logout-all', '/auth/refresh', '/auth/logout-all']);
  });

  it('falha de rede ou 5xx não fingem que as sessões acabaram', async () => {
    stubFetch(new TypeError('offline'), json(503, { error: { code: 'SERVICE_UNAVAILABLE' } }));
    expect(await logoutAll()).toBe(false);
    expect(await logoutAll()).toBe(false);
  });
});

describe('authFetch', () => {
  it('SESSION_EXPIRED → renova uma vez e repete a requisição', async () => {
    const fetchMock = stubFetch(
      json(401, { error: { code: 'SESSION_EXPIRED' } }),
      json(200, {}), // /auth/refresh
      json(200, { ok: true })
    );
    const response = await authFetch('/api/v1/articles');
    expect(response.status).toBe(200);
    expect(fetchMock.mock.calls.map((call) => (call as unknown[])[0])).toEqual([
      '/api/v1/articles',
      '/auth/refresh',
      '/api/v1/articles',
    ]);
  });

  it('refresh falhou → devolve o 401 original, sem loop', async () => {
    const fetchMock = stubFetch(
      json(401, { error: { code: 'SESSION_EXPIRED' } }),
      json(401, { error: { code: 'UNAUTHORIZED' } })
    );
    const response = await authFetch('/api/v1/articles');
    expect(response.status).toBe(401);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('outros 401/403 não disparam refresh', async () => {
    const fetchMock = stubFetch(
      json(401, { error: { code: 'UNAUTHORIZED' } }),
      json(403, { error: { code: 'FORBIDDEN' } })
    );
    expect((await authFetch('/a')).status).toBe(401);
    expect((await authFetch('/b')).status).toBe(403);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('toda resposta de autenticação é lida por inteiro', () => {
  // Corpo sem ler: o navegador não encerra a requisição e segura a conexão (achado real:
  // /auth/refresh do visitante ficava "aberto" e atrasava as próximas requisições).
  it.each([
    ['refreshSession (401)', () => refreshSession(), 401],
    ['logout (204)', () => logout(), 204],
    ['logout (503)', () => logout(), 503],
    ['login (401)', () => login('a@b.c', 'x'), 401],
    ['login (429)', () => login('a@b.c', 'x'), 429],
    [
      'register (409)',
      () =>
        register({
          email: 'a@b.c',
          password: 'x',
          username: 'abc',
          displayName: 'A',
          acceptTerms: true,
          termsVersion: 'v',
          privacyVersion: 'v',
        }),
      409,
    ],
    ['requestEditorAccess (201)', () => requestEditorAccess(), 201],
    ['requestEditorAccess (409)', () => requestEditorAccess(), 409],
    ['changePassword (204)', () => changePassword('a', 'b'), 204],
    ['changePassword (429)', () => changePassword('a', 'b'), 429],
  ] as const)('%s', async (_, call, status) => {
    const responses: Response[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        const body = status === 204 ? null : JSON.stringify({ error: { code: 'X', message: 'x' } });
        const response = new Response(body, { status });
        responses.push(response);
        return response;
      })
    );
    await call();
    expect(responses.length).toBeGreaterThan(0);
    for (const response of responses) {
      if (status !== 204) expect(response.bodyUsed).toBe(true);
    }
  });
});
