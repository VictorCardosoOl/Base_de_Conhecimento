// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Sem configuração de autenticação (como no build do CI e da Vercel), nenhuma rota protegida
// pode conceder acesso nem derrubar o build: a sessão fica "indisponível" (falha fechada),
// com log claro, e a leitura da configuração só acontece em tempo de requisição.

const server = vi.hoisted(() => ({ connection: vi.fn(async () => undefined) }));
vi.mock('next/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('next/server')>()),
  connection: server.connection,
}));
vi.mock('next/headers', () => ({ cookies: vi.fn(async () => ({ get: () => undefined })) }));
vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`redirect:${url}`);
  }),
  forbidden: vi.fn(() => {
    throw new Error('forbidden');
  }),
}));

import {
  AuthServiceUnavailableError,
  CONTENT_ROLES,
  authorizeAction,
  loadSessionDeps,
  requireAdmin,
  requireRole,
  requireSession,
} from '@/features/auth/session';
import { createUserAction } from '@/features/auth/user-actions';
import { GET as sessionRoute } from '@/app/api/session/route';

const AUTH_VARS = ['AUTH_INTERNAL_URL', 'AUTH_ISSUER', 'AUTH_AUDIENCE', 'AUTH_ACCESS_COOKIE_NAME', 'AUTH_JWKS_URL'];

describe('sem configuração de autenticação', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    for (const name of AUTH_VARS) vi.stubEnv(name, '');
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    consoleError.mockRestore();
  });

  it('a sessão fica indisponível (falha fechada), depois de marcar a rota como dinâmica', async () => {
    await expect(loadSessionDeps()).rejects.toBeInstanceOf(AuthServiceUnavailableError);
    expect(server.connection).toHaveBeenCalled();
    expect(String(consoleError.mock.calls[0]?.[0])).toContain('Configuração de autenticação inválida');
  });

  it('requireSession, requireRole e requireAdmin não concedem acesso nem lançam AuthConfigError', async () => {
    for (const call of [
      () => requireSession('/conta', {}),
      () => requireRole(CONTENT_ROLES, '/admin', {}),
      () => requireAdmin('/admin/usuarios', {}),
    ]) {
      await expect(call()).rejects.toBeInstanceOf(AuthServiceUnavailableError);
    }
  });

  it('Server Actions respondem "indisponível" em vez de lançar exceção', async () => {
    await expect(authorizeAction(['admin'])).resolves.toEqual({ ok: false, reason: 'unavailable' });
    await expect(
      createUserAction({ email: 'pessoa@exemplo.test', role: 'user', username: 'pessoa', displayName: 'Pessoa' })
    ).resolves.toEqual({ ok: false, error: 'unavailable' });
  });

  it('/api/session responde "não autenticado", mesmo com configuração incompleta', async () => {
    expect(await (await sessionRoute()).json()).toEqual({ authenticated: false });
    vi.stubEnv('AUTH_INTERNAL_URL', 'http://auth.internal:8010'); // sem emissor, audiência e cookie
    const response = await sessionRoute();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ authenticated: false });
  });
});

describe('páginas protegidas', () => {
  const PAGES = [
    'src/app/conta/page.tsx',
    'src/app/conta/senha/page.tsx',
    'src/app/admin/page.tsx',
    'src/app/admin/editor/page.tsx',
    'src/app/admin/solicitacoes/page.tsx',
    'src/app/admin/usuarios/page.tsx',
  ];

  it.each(PAGES)('%s é declarada dinâmica (nunca pré-renderizada no build)', (page) => {
    const source = readFileSync(resolve(__dirname, '../../..', page), 'utf8');
    expect(source).toMatch(/^export const dynamic = 'force-dynamic';$/m);
  });

  it('/api/session é declarada dinâmica', () => {
    const source = readFileSync(resolve(__dirname, '../../app/api/session/route.ts'), 'utf8');
    expect(source).toMatch(/^export const dynamic = 'force-dynamic';$/m);
  });
});
