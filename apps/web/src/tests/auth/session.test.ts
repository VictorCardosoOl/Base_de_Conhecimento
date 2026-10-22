// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { createLocalJWKSet, createRemoteJWKSet, customFetch } from 'jose';

vi.mock('next/headers', () => ({ cookies: vi.fn() }));

class RedirectSignal extends Error {
  constructor(public readonly url: string) {
    super(`redirect:${url}`);
  }
}
class ForbiddenSignal extends Error {
  constructor() {
    super('forbidden');
  }
}
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new RedirectSignal(url);
  }),
  forbidden: vi.fn(() => {
    throw new ForbiddenSignal();
  }),
}));

import { cookies } from 'next/headers';
import {
  AuthServiceUnavailableError,
  CONTENT_ROLES,
  USER_ADMIN_ROLES,
  authorizeAction,
  defaultSessionDeps,
  fetchCurrentUser,
  requireAdmin,
  requireRole,
  requireSession,
  verifyAccessToken,
  type SessionDeps,
} from '@/features/auth/session';
import type { AuthConfig } from '@/features/auth/config';
import { AUDIENCE, ISSUER, USER_ID, makeKey, signToken, type TestKey } from './keys';

const CONFIG: AuthConfig = {
  internalUrl: 'http://auth.internal:8010',
  issuer: ISSUER,
  audience: AUDIENCE,
  accessCookieName: 'kb_at',
  jwksUrl: 'http://auth.internal:8010/.well-known/jwks.json',
};

let key: TestKey;
let otherKey: TestKey;
let keySet: ReturnType<typeof createLocalJWKSet>;

beforeAll(async () => {
  key = await makeKey('kid-atual');
  otherKey = await makeKey('kid-intruso');
  keySet = createLocalJWKSet({ keys: [key.jwk] });
});

function meResponse(
  role: 'admin' | 'editor' | 'user',
  status = 200,
  mustChangePassword = false
): typeof fetch {
  return vi.fn(async () =>
    new Response(
      JSON.stringify({
        id: USER_ID,
        email: `${role}@teste.local`,
        username: role,
        display_name: `Pessoa ${role}`,
        role,
        must_change_password: mustChangePassword,
      }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  ) as unknown as typeof fetch;
}

function deps(token: string | undefined, fetchImpl: typeof fetch = meResponse('admin')): SessionDeps {
  return { config: CONFIG, keySet, readAccessToken: async () => token, fetchImpl };
}

async function outcome(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
    return 'permitido';
  } catch (error) {
    if (error instanceof RedirectSignal) return `redirect ${error.url}`;
    if (error instanceof ForbiddenSignal) return '403';
    throw error;
  }
}

describe('verifyAccessToken', () => {
  it('1. sem cookie → missing', async () => {
    expect(await verifyAccessToken(undefined, CONFIG, keySet)).toEqual({ status: 'missing' });
  });

  it('2. cookie que não é um JWT → invalid', async () => {
    expect((await verifyAccessToken('nao-e-um-jwt', CONFIG, keySet)).status).toBe('invalid');
  });

  it('3. assinatura de outra chave (mesmo kid) → invalid', async () => {
    const forged = await signToken(otherKey, { kid: key.kid });
    expect((await verifyAccessToken(forged, CONFIG, keySet)).status).toBe('invalid');
  });

  it('4. iss incorreto → invalid', async () => {
    const token = await signToken(key, { issuer: 'http://outro-emissor' });
    expect((await verifyAccessToken(token, CONFIG, keySet)).status).toBe('invalid');
  });

  it('5. aud incorreto → invalid', async () => {
    const token = await signToken(key, { audience: 'outra-api' });
    expect((await verifyAccessToken(token, CONFIG, keySet)).status).toBe('invalid');
  });

  it('6. token expirado → expired', async () => {
    const token = await signToken(key, { expiresIn: Math.floor(Date.now() / 1000) - 60 });
    expect((await verifyAccessToken(token, CONFIG, keySet)).status).toBe('expired');
  });

  it('7. kid desconhecido → invalid', async () => {
    const token = await signToken(otherKey);
    expect((await verifyAccessToken(token, CONFIG, keySet)).status).toBe('invalid');
  });

  it('8. token válido → claims do usuário autenticado', async () => {
    const state = await verifyAccessToken(await signToken(key, { role: 'user' }), CONFIG, keySet);
    expect(state.status).toBe('valid');
    if (state.status === 'valid') {
      expect(state.claims.userId).toBe(USER_ID);
      expect(state.claims.role).toBe('user');
      expect(state.claims.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }
  });

  it('rejeita claims fora do contrato (sub não UUID, papel desconhecido)', async () => {
    const badSub = await signToken(key, { sub: 'admin@teste.local' });
    const badRole = await signToken(key, { role: 'superadmin' });
    expect((await verifyAccessToken(badSub, CONFIG, keySet)).status).toBe('invalid');
    expect((await verifyAccessToken(badRole, CONFIG, keySet)).status).toBe('invalid');
  });

  it('aceita a chave anterior durante uma rotação (JWKS com duas chaves)', async () => {
    const rotated = createLocalJWKSet({ keys: [otherKey.jwk, key.jwk] });
    const fromOldKey = await signToken(key);
    expect((await verifyAccessToken(fromOldKey, CONFIG, rotated)).status).toBe('valid');
  });

  it('recarrega o JWKS remoto quando aparece um kid novo', async () => {
    const newKey = await makeKey('kid-novo');
    let published = [key.jwk];
    const fetchJwks = vi.fn(async () =>
      new Response(JSON.stringify({ keys: published }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
    const remote = createRemoteJWKSet(new URL(CONFIG.jwksUrl), {
      cooldownDuration: 0,
      [customFetch]: fetchJwks,
    });

    expect((await verifyAccessToken(await signToken(key), CONFIG, remote)).status).toBe('valid');
    published = [newKey.jwk, key.jwk]; // AuthService rotacionou a chave
    expect((await verifyAccessToken(await signToken(newKey), CONFIG, remote)).status).toBe('valid');
    expect(fetchJwks).toHaveBeenCalledTimes(2);
  });
});

describe('verifyAccessToken com AuthService indisponível', () => {
  function remoteJwks(fetchImpl: () => Promise<Response>) {
    return createRemoteJWKSet(new URL(CONFIG.jwksUrl), { [customFetch]: fetchImpl });
  }

  it('JWKS inacessível → AuthServiceUnavailableError (não "token inválido")', async () => {
    const unreachable = remoteJwks(async () => {
      throw new TypeError('connect ECONNREFUSED');
    });
    await expect(verifyAccessToken(await signToken(key), CONFIG, unreachable)).rejects.toThrow(
      AuthServiceUnavailableError
    );
  });

  it('JWKS respondendo 503 → AuthServiceUnavailableError', async () => {
    const failing = remoteJwks(async () => new Response('indisponível', { status: 503 }));
    await expect(verifyAccessToken(await signToken(key), CONFIG, failing)).rejects.toThrow(
      AuthServiceUnavailableError
    );
  });

  it('requireAdmin com JWKS inacessível falha fechado (erro), sem mandar ao login', async () => {
    const unreachable = remoteJwks(async () => {
      throw new TypeError('connect ECONNREFUSED');
    });
    const token = await signToken(key);
    await expect(
      requireAdmin('/admin', {}, { ...deps(token), keySet: unreachable })
    ).rejects.toThrow(AuthServiceUnavailableError);
  });
});

describe('fetchCurrentUser', () => {
  it('envia o token como Bearer, sem cache, e devolve o usuário', async () => {
    const fetchImpl = meResponse('admin');
    const user = await fetchCurrentUser('tok', CONFIG, fetchImpl);
    expect(user).toEqual({
      id: USER_ID,
      email: 'admin@teste.local',
      username: 'admin',
      displayName: 'Pessoa admin',
      role: 'admin',
      mustChangePassword: false,
    });
    const [url, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe('http://auth.internal:8010/auth/me');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.cache).toBe('no-store');
  });

  it('repassa a confirmação do email e a existência de senha quando o AuthService informa', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: USER_ID,
            email: 'a@b.c',
            username: 'a',
            display_name: 'A',
            role: 'user',
            must_change_password: false,
            email_verified: true,
            has_password: false,
          }),
          { status: 200 }
        )
    ) as unknown as typeof fetch;
    expect(await fetchCurrentUser('tok', CONFIG, fetchImpl)).toMatchObject({
      emailVerified: true,
      hasPassword: false,
    });
  });

  it('401 (sessão revogada/expirada) → null', async () => {
    expect(await fetchCurrentUser('tok', CONFIG, meResponse('admin', 401))).toBeNull();
  });

  it('falha fechada: erro de rede, 5xx ou resposta fora do contrato', async () => {
    const network = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    const badBody = vi.fn(async () => new Response('{"id":1}', { status: 200 })) as unknown as typeof fetch;
    // Sem must_change_password: fora do contrato, não "presume false".
    const noFlag = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ id: USER_ID, email: 'a@b.c', username: 'a', display_name: 'A', role: 'admin' }),
          { status: 200 }
        )
    ) as unknown as typeof fetch;
    // AuthService anterior ao ADR-0011 (sem usuário/nome): fora do contrato.
    const noIdentity = vi.fn(
      async () =>
        new Response(
          JSON.stringify({ id: USER_ID, email: 'a@b.c', role: 'admin', must_change_password: false }),
          { status: 200 }
        )
    ) as unknown as typeof fetch;
    await expect(fetchCurrentUser('tok', CONFIG, noFlag)).rejects.toThrow(AuthServiceUnavailableError);
    await expect(fetchCurrentUser('tok', CONFIG, noIdentity)).rejects.toThrow(AuthServiceUnavailableError);
    await expect(fetchCurrentUser('tok', CONFIG, network)).rejects.toThrow(AuthServiceUnavailableError);
    await expect(fetchCurrentUser('tok', CONFIG, meResponse('admin', 503))).rejects.toThrow(
      AuthServiceUnavailableError
    );
    await expect(fetchCurrentUser('tok', CONFIG, badBody)).rejects.toThrow(AuthServiceUnavailableError);
  });
});

describe('requireAdmin', () => {
  beforeEach(() => vi.clearAllMocks());

  it('1. sem cookie → /login?next=/admin', async () => {
    expect(await outcome(requireAdmin('/admin', {}, deps(undefined)))).toBe(
      'redirect /login?next=%2Fadmin'
    );
  });

  it('2/3. cookie inválido ou forjado → login, sem consultar o AuthService', async () => {
    const fetchImpl = meResponse('admin');
    const forged = await signToken(otherKey, { kid: key.kid });
    expect(await outcome(requireAdmin('/admin', {}, deps('lixo', fetchImpl)))).toMatch(/^redirect/);
    expect(await outcome(requireAdmin('/admin', {}, deps(forged, fetchImpl)))).toMatch(/^redirect/);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('6. sessão expirada → login', async () => {
    const expired = await signToken(key, { expiresIn: Math.floor(Date.now() / 1000) - 60 });
    expect(await outcome(requireAdmin('/admin', {}, deps(expired)))).toBe(
      'redirect /login?next=%2Fadmin'
    );
  });

  it('sessão revogada no AuthService (/auth/me 401) → login', async () => {
    const token = await signToken(key);
    expect(await outcome(requireAdmin('/admin', {}, deps(token, meResponse('admin', 401))))).toBe(
      'redirect /login?next=%2Fadmin'
    );
  });

  it('9. role=user tentando /admin → 403', async () => {
    const token = await signToken(key, { role: 'user' });
    expect(await outcome(requireAdmin('/admin', {}, deps(token, meResponse('user'))))).toBe('403');
  });

  it('10. role=admin acessando /admin → permitido', async () => {
    const token = await signToken(key, { role: 'admin' });
    const user = await requireAdmin('/admin', {}, deps(token, meResponse('admin')));
    expect(user.role).toBe('admin');
  });

  it('11. /admin/editor com admin → permitido', async () => {
    const token = await signToken(key, { role: 'admin' });
    expect(await outcome(requireAdmin('/admin/editor', {}, deps(token, meResponse('admin'))))).toBe(
      'permitido'
    );
  });

  it('12. preserva o caminho e a query no parâmetro next', async () => {
    expect(await outcome(requireAdmin('/admin/editor', { id: 'pgr', tab: ['a', 'b'] }, deps(undefined)))).toBe(
      'redirect /login?next=%2Fadmin%2Feditor%3Fid%3Dpgr%26tab%3Da%26tab%3Db'
    );
  });

  it('o papel vem do AuthService, não do JWT', async () => {
    // Token antigo ainda diz admin, mas o usuário foi rebaixado no banco.
    const stale = await signToken(key, { role: 'admin' });
    expect(await outcome(requireAdmin('/admin', {}, deps(stale, meResponse('user'))))).toBe('403');
    // E o inverso: promovido depois da emissão do token.
    const promoted = await signToken(key, { role: 'user' });
    expect(await outcome(requireAdmin('/admin', {}, deps(promoted, meResponse('admin'))))).toBe(
      'permitido'
    );
  });

  it('AuthService indisponível → erro (falha fechada, nunca libera)', async () => {
    const token = await signToken(key);
    const down = vi.fn(async () => {
      throw new TypeError('ECONNREFUSED');
    }) as unknown as typeof fetch;
    await expect(requireAdmin('/admin', {}, deps(token, down))).rejects.toThrow(
      AuthServiceUnavailableError
    );
  });
});

describe('defaultSessionDeps', () => {
  it('lê a configuração do ambiente, o cookie configurado e reaproveita o JWKS remoto', async () => {
    vi.stubEnv('AUTH_INTERNAL_URL', 'http://auth.internal:8010');
    vi.stubEnv('AUTH_ISSUER', ISSUER);
    vi.stubEnv('AUTH_AUDIENCE', AUDIENCE);
    vi.stubEnv('AUTH_ACCESS_COOKIE_NAME', 'kb_at');
    vi.mocked(cookies).mockResolvedValue({
      get: (name: string) => (name === 'kb_at' ? { name, value: 'token-do-cookie' } : undefined),
    } as unknown as Awaited<ReturnType<typeof cookies>>);

    const first = defaultSessionDeps();
    const second = defaultSessionDeps();

    expect(first.config.jwksUrl).toBe('http://auth.internal:8010/.well-known/jwks.json');
    expect(await first.readAccessToken()).toBe('token-do-cookie');
    expect(second.keySet).toBe(first.keySet);

    vi.stubEnv('AUTH_JWKS_URL', 'http://outro-auth:8010/.well-known/jwks.json');
    expect(defaultSessionDeps().keySet).not.toBe(first.keySet);
    vi.unstubAllEnvs();
  });
});

describe('papéis: painel/editor (admin, editor) × usuários (admin)', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([
    ['admin', '/admin', 'permitido'],
    ['admin', '/admin/editor', 'permitido'],
    ['editor', '/admin', 'permitido'],
    ['editor', '/admin/editor', 'permitido'],
    ['user', '/admin', '403'],
    ['user', '/admin/editor', '403'],
  ] as const)('%s em %s (conteúdo) → %s', async (role, path, expected) => {
    const token = await signToken(key, { role });
    expect(await outcome(requireRole(CONTENT_ROLES, path, {}, deps(token, meResponse(role))))).toBe(expected);
  });

  it.each([
    ['admin', 'permitido'],
    ['editor', '403'],
    ['user', '403'],
  ] as const)('%s em /admin/usuarios → %s', async (role, expected) => {
    const token = await signToken(key, { role });
    expect(
      await outcome(requireRole(USER_ADMIN_ROLES, '/admin/usuarios', {}, deps(token, meResponse(role))))
    ).toBe(expected);
  });

  it('devolve o access token só para uso server-side (chamadas ao AuthService)', async () => {
    const token = await signToken(key, { role: 'admin' });
    const session = await requireRole(USER_ADMIN_ROLES, '/admin/usuarios', {}, deps(token));
    expect(session.accessToken).toBe(token);
  });
});

describe('troca de senha obrigatória', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(['/admin', '/admin/editor', '/admin/usuarios', '/conta'])(
    'pendente: %s redireciona para /conta/senha preservando o destino',
    async (path) => {
      const token = await signToken(key, { role: 'admin' });
      const result = await outcome(
        requireSession(path, { pagina: '2' }, { roles: CONTENT_ROLES }, deps(token, meResponse('admin', 200, true)))
      );
      const next = encodeURIComponent(`${path}?pagina=2`);
      expect(result).toBe(`redirect /conta/senha?next=${next}`);
    }
  );

  it('pendência vem antes do papel: user com troca pendente não vê nem o 403', async () => {
    const token = await signToken(key, { role: 'user' });
    expect(
      await outcome(requireRole(CONTENT_ROLES, '/admin', {}, deps(token, meResponse('user', 200, true))))
    ).toBe('redirect /conta/senha?next=%2Fadmin');
  });

  it('a própria página de troca abre com a pendência', async () => {
    const token = await signToken(key, { role: 'editor' });
    const session = await requireSession(
      '/conta/senha',
      {},
      { allowPendingPasswordChange: true },
      deps(token, meResponse('editor', 200, true))
    );
    expect(session.user.mustChangePassword).toBe(true);
  });

  it('sem pendência, /conta abre para qualquer papel', async () => {
    const token = await signToken(key, { role: 'user' });
    expect(await outcome(requireSession('/conta', {}, {}, deps(token, meResponse('user'))))).toBe('permitido');
  });
});

describe('authorizeAction (Server Actions)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('admin ativo → ok com a sessão', async () => {
    const token = await signToken(key, { role: 'admin' });
    const result = await authorizeAction(USER_ADMIN_ROLES, deps(token));
    expect(result).toMatchObject({ ok: true, session: { accessToken: token, user: { role: 'admin' } } });
  });

  it('motivos: sem sessão, expirada, troca pendente, papel, indisponível', async () => {
    const expired = await signToken(key, { expiresIn: Math.floor(Date.now() / 1000) - 60 });
    const token = await signToken(key, { role: 'admin' });
    const down = vi.fn(async () => new Response('', { status: 503 })) as unknown as typeof fetch;

    expect(await authorizeAction(USER_ADMIN_ROLES, deps(undefined))).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(await authorizeAction(USER_ADMIN_ROLES, deps(expired))).toEqual({ ok: false, reason: 'session_expired' });
    expect(await authorizeAction(USER_ADMIN_ROLES, deps(token, meResponse('admin', 401)))).toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
    expect(await authorizeAction(USER_ADMIN_ROLES, deps(token, meResponse('admin', 200, true)))).toEqual({
      ok: false,
      reason: 'password_change_required',
    });
    expect(await authorizeAction(USER_ADMIN_ROLES, deps(token, meResponse('editor')))).toEqual({
      ok: false,
      reason: 'forbidden',
    });
    expect(await authorizeAction(USER_ADMIN_ROLES, deps(token, down))).toEqual({ ok: false, reason: 'unavailable' });
  });

  it('o papel do JWT não basta: token diz admin, AuthService diz editor → forbidden', async () => {
    const stale = await signToken(key, { role: 'admin' });
    expect(await authorizeAction(USER_ADMIN_ROLES, deps(stale, meResponse('editor')))).toEqual({
      ok: false,
      reason: 'forbidden',
    });
  });
});
