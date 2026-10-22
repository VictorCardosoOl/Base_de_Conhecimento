// @vitest-environment node
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { createLocalJWKSet } from 'jose';
import {
  createUserAction,
  decideRoleRequestAction,
  resetPasswordAction,
  updateUserAction,
  type UserActionDeps,
} from '@/features/auth/user-actions';
import type { AuthConfig } from '@/features/auth/config';
import { AUDIENCE, ISSUER, USER_ID, makeKey, signToken, type TestKey } from './keys';

const CONFIG: AuthConfig = {
  internalUrl: 'http://auth.internal:8010',
  issuer: ISSUER,
  audience: AUDIENCE,
  accessCookieName: 'kb_at',
  jwksUrl: 'http://auth.internal:8010/.well-known/jwks.json',
};
const TARGET = '0f5f0c2e-6a3b-4d1e-9c1a-2b3c4d5e6f70';
const TEMP = 'Temp-Pass-Word-9999';
const NEW = { email: 'a@b.com.br', role: 'user', username: 'alguem', displayName: 'Alguém' };
const RAW = {
  id: TARGET,
  email: 'pessoa@empresa.com.br',
  username: 'pessoa',
  display_name: 'Pessoa',
  role: 'editor',
  is_active: true,
  must_change_password: true,
  created_at: '2026-09-27T10:00:00Z',
  last_login_at: null,
};

let key: TestKey;
beforeAll(async () => {
  key = await makeKey('kid-atual');
});

type Route = { status: number; body?: unknown };

/** Simula o AuthService: /auth/me responde `me`; demais rotas, `admin`. Registra as chamadas. */
function authService(me: Route, admin: Route = { status: 200, body: RAW }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const route = url.endsWith('/auth/me') ? me : admin;
    return route.body === undefined
      ? new Response(null, { status: route.status })
      : new Response(JSON.stringify(route.body), { status: route.status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls, adminCalls: () => calls.filter((c) => !c.url.endsWith('/auth/me')) };
}

const meAs = (role: string, mustChangePassword = false): Route => ({
  status: 200,
  body: {
    id: USER_ID,
    email: `${role}@teste.local`,
    username: role,
    display_name: role,
    role,
    must_change_password: mustChangePassword,
  },
});

async function deps(fetchImpl: typeof fetch, tokenRole = 'admin', token?: string): Promise<UserActionDeps> {
  const accessToken = token ?? (await signToken(key, { role: tokenRole }));
  return {
    session: {
      config: CONFIG,
      keySet: createLocalJWKSet({ keys: [key.jwk] }),
      readAccessToken: async () => accessToken,
      fetchImpl,
    },
    generatePassword: () => TEMP,
    fetchImpl,
  };
}

describe('Server Actions de /admin/usuarios', () => {
  let logs: ReturnType<typeof vi.spyOn>[];
  beforeEach(() => {
    logs = (['log', 'info', 'warn', 'error', 'debug'] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => undefined)
    );
  });
  afterEach(() => {
    // Nenhuma ação escreve no console (e muito menos a senha temporária).
    for (const spy of logs) {
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    }
  });

  it('cria: reautoriza no AuthService, envia a senha gerada e a devolve uma vez', async () => {
    const api = authService(meAs('admin'), { status: 201, body: RAW });
    const result = await createUserAction(
      { email: '  pessoa@empresa.com.br ', role: 'editor', username: ' Pessoa ', displayName: ' Pessoa Silva ' },
      await deps(api.fetchImpl)
    );
    expect(result).toEqual({ ok: true, temporaryPassword: TEMP });
    expect(api.calls[0].url).toBe('http://auth.internal:8010/auth/me');
    const [create] = api.adminCalls();
    expect(create.url).toBe('http://auth.internal:8010/admin/users');
    expect(JSON.parse(String(create.init.body))).toEqual({
      email: 'pessoa@empresa.com.br',
      role: 'editor',
      password: TEMP,
      username: 'pessoa',
      display_name: 'Pessoa Silva',
    });
    expect((create.init.headers as Record<string, string>).Authorization).toMatch(/^Bearer /);
  });

  it.each([
    ['editor', meAs('editor'), 'forbidden'],
    ['user', meAs('user'), 'forbidden'],
    ['admin com troca pendente', meAs('admin', true), 'password_change_required'],
    ['sessão revogada', { status: 401 }, 'unauthenticated'],
    ['AuthService fora', { status: 503 }, 'unavailable'],
  ] as const)('%s não executa nenhuma operação administrativa', async (_, me, error) => {
    const api = authService(me);
    const d = await deps(api.fetchImpl);
    expect(await createUserAction(NEW, d)).toEqual({ ok: false, error });
    expect(await updateUserAction(TARGET, { role: 'admin' }, d)).toEqual({ ok: false, error });
    expect(await resetPasswordAction(TARGET, d)).toEqual({ ok: false, error });
    expect(api.adminCalls()).toEqual([]);
  });

  it('o JWT dizendo admin não basta: o papel atual vem de /auth/me', async () => {
    const api = authService(meAs('editor'));
    expect(await resetPasswordAction(TARGET, await deps(api.fetchImpl, 'admin'))).toEqual({
      ok: false,
      error: 'forbidden',
    });
    expect(api.adminCalls()).toEqual([]);
  });

  it('access expirado → session_expired (o cliente renova e tenta de novo)', async () => {
    const api = authService(meAs('admin'));
    const expired = await signToken(key, { expiresIn: Math.floor(Date.now() / 1000) - 60 });
    expect(await createUserAction(NEW, await deps(api.fetchImpl, 'admin', expired))).toEqual({
      ok: false,
      error: 'session_expired',
    });
    expect(api.calls).toEqual([]);
  });

  it.each([
    [{ ...NEW, email: 'sem-arroba' }],
    [{ ...NEW, role: 'superadmin' }],
    [{ ...NEW, email: 42 }],
    [{ ...NEW, email: `${'x'.repeat(250)}@b.com.br` }],
    [{ ...NEW, username: 'ab' }],
    [{ ...NEW, username: 'com espaço' }],
    [{ ...NEW, username: undefined }],
    [{ ...NEW, displayName: '   ' }],
    [{ ...NEW, displayName: 'x'.repeat(101) }],
    [{ ...NEW, displayName: 7 }],
  ])('entrada inválida na criação é barrada antes do AuthService: %j', async (input) => {
    const api = authService(meAs('admin'));
    expect(await createUserAction(input, await deps(api.fetchImpl))).toEqual({ ok: false, error: 'invalid_input' });
    expect(api.adminCalls()).toEqual([]);
  });

  it('altera papel/ativação; valida id, campos e tipos', async () => {
    const api = authService(meAs('admin'), { status: 200, body: { ...RAW, role: 'user' } });
    const d = await deps(api.fetchImpl);
    expect(await updateUserAction(TARGET, { role: 'user' }, d)).toEqual({ ok: true });
    expect(await updateUserAction(TARGET, { isActive: false }, d)).toEqual({ ok: true });
    const bodies = api.adminCalls().map((c) => JSON.parse(String(c.init.body)));
    expect(bodies).toEqual([{ role: 'user' }, { is_active: false }]);

    for (const [id, changes] of [
      ['nao-e-uuid', { role: 'user' }],
      [TARGET, {}],
      [TARGET, { role: 'root' }],
      [TARGET, { isActive: 'false' }],
    ] as const) {
      expect(await updateUserAction(id, changes, d)).toEqual({ ok: false, error: 'invalid_input' });
    }
  });

  it('admin não altera nem redefine a si mesmo', async () => {
    const api = authService(meAs('admin'));
    const d = await deps(api.fetchImpl);
    expect(await updateUserAction(USER_ID, { role: 'user' }, d)).toEqual({ ok: false, error: 'self_change' });
    expect(await resetPasswordAction(USER_ID, d)).toEqual({ ok: false, error: 'self_change' });
    expect(api.adminCalls()).toEqual([]);
  });

  it('redefine: envia a senha gerada e a devolve; erro não devolve senha', async () => {
    const ok = authService(meAs('admin'), { status: 204 });
    expect(await resetPasswordAction(TARGET, await deps(ok.fetchImpl))).toEqual({ ok: true, temporaryPassword: TEMP });
    expect(JSON.parse(String(ok.adminCalls()[0].init.body))).toEqual({ password: TEMP });

    const missing = authService(meAs('admin'), { status: 404, body: { error: { code: 'NOT_FOUND' } } });
    const result = await resetPasswordAction(TARGET, await deps(missing.fetchImpl));
    expect(result).toEqual({ ok: false, error: 'not_found' });
    expect(JSON.stringify(result)).not.toContain(TEMP);
  });

  it.each(['admin', 'editor'])('%s decide pedidos de acesso de editor', async (role) => {
    const api = authService(meAs(role), { status: 200, body: { status: 'approved' } });
    expect(await decideRoleRequestAction(TARGET, 'approve', await deps(api.fetchImpl))).toEqual({ ok: true });
    expect(api.adminCalls()[0].url).toBe(`http://auth.internal:8010/admin/role-requests/${TARGET}/approve`);
  });

  it('leitor não decide pedidos (nem o próprio); entradas inválidas são barradas', async () => {
    const asUser = authService(meAs('user'));
    expect(await decideRoleRequestAction(TARGET, 'approve', await deps(asUser.fetchImpl, 'user'))).toEqual({
      ok: false,
      error: 'forbidden',
    });
    expect(asUser.adminCalls()).toEqual([]);

    const asEditor = authService(meAs('editor'));
    const d = await deps(asEditor.fetchImpl, 'editor');
    expect(await decideRoleRequestAction('nao-e-uuid', 'approve', d)).toEqual({ ok: false, error: 'invalid_input' });
    expect(await decideRoleRequestAction(TARGET, 'promote-to-admin', d)).toEqual({ ok: false, error: 'invalid_input' });
    expect(asEditor.adminCalls()).toEqual([]);
  });

  it('editor continua sem poderes de gestão de usuários', async () => {
    const api = authService(meAs('editor'));
    const d = await deps(api.fetchImpl, 'editor');
    expect(await createUserAction(NEW, d)).toEqual({ ok: false, error: 'forbidden' });
    expect(await updateUserAction(TARGET, { role: 'editor' }, d)).toEqual({ ok: false, error: 'forbidden' });
    expect(api.adminCalls()).toEqual([]);
  });
});
