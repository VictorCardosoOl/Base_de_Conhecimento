// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  createUser,
  generateTemporaryPassword,
  listUsers,
  resetUserPassword,
  updateUser,
} from '@/features/auth/users';

const CONFIG = { internalUrl: 'http://auth.internal:8010' };
const ID = '351a1fb1-c472-4834-ba49-ba5128e5e974';
const RAW = {
  id: ID,
  email: 'pessoa@empresa.com.br',
  username: 'pessoa',
  display_name: 'Pessoa',
  role: 'editor',
  is_active: true,
  must_change_password: true,
  created_at: '2026-09-27T10:00:00Z',
  last_login_at: null,
};

function respond(status: number, body?: unknown) {
  return vi.fn(async () =>
    body === undefined
      ? new Response(null, { status })
      : new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
  ) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

const err = (code: string) => ({ error: { code, message: 'x' } });

describe('API administrativa do AuthService (server-side)', () => {
  it('lista com paginação, Bearer e sem cache', async () => {
    const fetchImpl = respond(200, { items: [RAW], total: 1, limit: 20, offset: 40 });
    const result = await listUsers('tok', CONFIG, { limit: 20, offset: 40 }, fetchImpl);
    expect(result).toEqual({
      ok: true,
      value: {
        items: [
          {
            id: ID,
            email: 'pessoa@empresa.com.br',
            username: 'pessoa',
            displayName: 'Pessoa',
            role: 'editor',
            isActive: true,
            mustChangePassword: true,
            createdAt: '2026-09-27T10:00:00Z',
            lastLoginAt: null,
          },
        ],
        total: 1,
        limit: 20,
        offset: 40,
      },
    });
    const [url, init] = fetchImpl.mock.calls[0];
    expect(url).toBe('http://auth.internal:8010/admin/users?limit=20&offset=40');

    // Com busca: o termo vai como ?q= (sem espaços nas pontas); busca vazia não vai.
    const search = respond(200, { items: [], total: 0, limit: 20, offset: 0 });
    await listUsers('tok', CONFIG, { limit: 20, offset: 0, query: '  maria silva ' }, search);
    expect(search.mock.calls[0][0]).toBe(
      'http://auth.internal:8010/admin/users?limit=20&offset=0&q=maria+silva'
    );
    const blank = respond(200, { items: [], total: 0, limit: 20, offset: 0 });
    await listUsers('tok', CONFIG, { limit: 20, offset: 0, query: '   ' }, blank);
    expect(blank.mock.calls[0][0]).toBe('http://auth.internal:8010/admin/users?limit=20&offset=0');
    expect(init.headers.Authorization).toBe('Bearer tok');
    expect(init.cache).toBe('no-store');
  });

  it('resposta fora do contrato na lista → indisponível (falha fechada)', async () => {
    const bad = respond(200, { items: [{ ...RAW, role: 'superadmin' }], total: 1 });
    expect(await listUsers('tok', CONFIG, { limit: 20, offset: 0 }, bad)).toEqual({ ok: false, error: 'unavailable' });
  });

  it('cria enviando email, papel, senha, usuário e nome; mapeia erros do contrato', async () => {
    const created = respond(201, RAW);
    const input = {
      email: 'pessoa@empresa.com.br',
      role: 'editor' as const,
      password: 'temp',
      username: 'pessoa',
      displayName: 'Pessoa',
    };
    const result = await createUser('tok', CONFIG, input, created);
    expect(result.ok && result.value).toMatchObject({ username: 'pessoa', displayName: 'Pessoa' });
    expect(JSON.parse(created.mock.calls[0][1].body)).toEqual({
      email: 'pessoa@empresa.com.br',
      role: 'editor',
      password: 'temp',
      username: 'pessoa',
      display_name: 'Pessoa',
    });

    const conflictOn = (field: string) =>
      respond(409, { error: { code: 'CONFLICT', message: 'x', details: [{ field, message: 'x' }] } });
    expect(await createUser('tok', CONFIG, input, respond(409, err('CONFLICT')))).toEqual({ ok: false, error: 'email_taken' });
    expect(await createUser('tok', CONFIG, input, conflictOn('email'))).toEqual({ ok: false, error: 'email_taken' });
    expect(await createUser('tok', CONFIG, input, conflictOn('username'))).toEqual({
      ok: false,
      error: 'username_taken',
    });
    expect(await createUser('tok', CONFIG, input, respond(400, err('VALIDATION_ERROR')))).toEqual({
      ok: false,
      error: 'invalid_input',
    });
    expect(await createUser('tok', CONFIG, input, respond(401, err('SESSION_EXPIRED')))).toEqual({
      ok: false,
      error: 'session_expired',
    });
    expect(await createUser('tok', CONFIG, input, respond(401, err('UNAUTHORIZED')))).toEqual({
      ok: false,
      error: 'unauthenticated',
    });
    expect(await createUser('tok', CONFIG, input, respond(403, err('FORBIDDEN')))).toEqual({ ok: false, error: 'forbidden' });
    expect(await createUser('tok', CONFIG, input, respond(503))).toEqual({ ok: false, error: 'unavailable' });
    const down = vi.fn(async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;
    expect(await createUser('tok', CONFIG, input, down)).toEqual({ ok: false, error: 'unavailable' });
  });

  it('altera com PATCH; 409 = último admin; 404 = não encontrado', async () => {
    const ok = respond(200, { ...RAW, role: 'user' });
    const result = await updateUser('tok', CONFIG, ID, { role: 'user' }, ok);
    expect(result.ok && result.value.role).toBe('user');
    expect(ok.mock.calls[0][0]).toBe(`http://auth.internal:8010/admin/users/${ID}`);
    expect(ok.mock.calls[0][1].method).toBe('PATCH');

    expect(await updateUser('tok', CONFIG, ID, { is_active: false }, respond(409, err('CONFLICT')))).toEqual({
      ok: false,
      error: 'last_admin',
    });
    expect(await updateUser('tok', CONFIG, ID, { role: 'user' }, respond(404, err('NOT_FOUND')))).toEqual({
      ok: false,
      error: 'not_found',
    });
  });

  it('redefine senha (204) no caminho do usuário', async () => {
    const ok = respond(204);
    expect(await resetUserPassword('tok', CONFIG, ID, 'temp', ok)).toEqual({ ok: true, value: null });
    expect(ok.mock.calls[0][0]).toBe(`http://auth.internal:8010/admin/users/${ID}/password`);
    expect(JSON.parse(ok.mock.calls[0][1].body)).toEqual({ password: 'temp' });
  });
});

describe('generateTemporaryPassword', () => {
  it('16 símbolos sem ambiguidade, em 4 grupos (atende a política de 12+ caracteres)', () => {
    for (let i = 0; i < 50; i++) {
      const password = generateTemporaryPassword();
      expect(password).toMatch(/^[A-HJ-NP-Za-km-z2-9]{4}(-[A-HJ-NP-Za-km-z2-9]{4}){3}$/);
      expect(password).not.toMatch(/[01OIl]/);
      expect(password.length).toBeGreaterThanOrEqual(12);
    }
  });

  it('não se repete e descarta bytes que causariam viés de módulo', () => {
    const seen = new Set(Array.from({ length: 200 }, () => generateTemporaryPassword()));
    expect(seen.size).toBe(200);

    // Bytes >= 228 (maior múltiplo de 57 abaixo de 256) são descartados.
    let call = 0;
    const random = (bytes: Uint8Array) => {
      bytes.fill(call++ === 0 ? 250 : 0);
      return bytes;
    };
    expect(generateTemporaryPassword(random)).toBe('AAAA-AAAA-AAAA-AAAA');
    expect(call).toBe(2);
  });
});
