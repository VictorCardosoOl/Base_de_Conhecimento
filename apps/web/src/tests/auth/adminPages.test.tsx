import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactElement } from 'react';

// Mock sem vi.fn: evita que o Vitest registre a promessa rejeitada como erro solto.
type Guard = (...args: unknown[]) => Promise<unknown>;
const auth = vi.hoisted(() => ({
  roleCalls: [] as unknown[][],
  sessionCalls: [] as unknown[][],
  impl: (async () => ({})) as Guard,
}));
vi.mock('@/features/auth/session', () => ({
  CONTENT_ROLES: ['admin', 'editor'],
  USER_ADMIN_ROLES: ['admin'],
  loadSessionDeps: async () => ({ config: { internalUrl: 'http://auth.internal' } }),
  requireRole: (...args: unknown[]) => {
    auth.roleCalls.push(args);
    return auth.impl(...args);
  },
  requireSession: (...args: unknown[]) => {
    auth.sessionCalls.push(args);
    return auth.impl(...args);
  },
}));

const users = vi.hoisted(() => ({
  listCalls: [] as unknown[][],
  result: { ok: true, value: { items: [], total: 0, limit: 20, offset: 0 } } as unknown,
}));
vi.mock('@/features/auth/users', () => ({
  listUsers: async (...args: unknown[]) => {
    users.listCalls.push(args);
    return users.result;
  },
}));

const nav = vi.hoisted(() => {
  class RedirectSignal extends Error {}
  return { RedirectSignal };
});
vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new nav.RedirectSignal(url);
  },
}));

// O teste cobre a ligação página → autorização; as UIs são substituídas por stubs.
vi.mock('@/app/admin/AdminDashboard', () => ({ AdminDashboard: () => null }));
vi.mock('@/app/admin/editor/ArticleEditor', () => ({ ArticleEditor: () => null }));
vi.mock('@/app/admin/usuarios/UsersManager', () => ({ UsersManager: () => null }));
vi.mock('@/app/conta/senha/ChangePasswordForm', () => ({ ChangePasswordForm: () => null }));
vi.mock('@/features/auth/components/LogoutButton', () => ({ LogoutButton: () => null }));

import AdminPage from '@/app/admin/page';
import EditorPage from '@/app/admin/editor/page';
import UsersPage from '@/app/admin/usuarios/page';
import ChangePasswordPage from '@/app/conta/senha/page';
import { AdminDashboard } from '@/app/admin/AdminDashboard';
import { ArticleEditor } from '@/app/admin/editor/ArticleEditor';
import { UsersManager } from '@/app/admin/usuarios/UsersManager';
import { ChangePasswordForm } from '@/app/conta/senha/ChangePasswordForm';

const session = (role: string, mustChangePassword = false) => ({
  user: { id: 'u-1', email: `${role}@teste.local`, username: role, displayName: `Pessoa ${role}`, role, mustChangePassword },
  accessToken: 'token-do-servidor',
});

describe('páginas protegidas', () => {
  beforeEach(() => {
    auth.roleCalls = [];
    auth.sessionCalls = [];
    auth.impl = async () => session('admin');
    users.listCalls = [];
    users.result = { ok: true, value: { items: [], total: 45, limit: 20, offset: 20 } };
  });

  it('/admin: admin e editor; o link Usuários só para admin', async () => {
    const asAdmin = (await AdminPage({ searchParams: Promise.resolve({}) })) as ReactElement<{
      canManageUsers: boolean;
    }>;
    expect(auth.roleCalls[0]).toEqual([['admin', 'editor'], '/admin', {}]);
    expect(asAdmin.type).toBe(AdminDashboard);
    expect(asAdmin.props.canManageUsers).toBe(true);

    auth.impl = async () => session('editor');
    const asEditor = (await AdminPage({ searchParams: Promise.resolve({}) })) as ReactElement<{
      canManageUsers: boolean;
    }>;
    expect(asEditor.props.canManageUsers).toBe(false);
  });

  it('/admin/editor: admin e editor, preservando a query', async () => {
    const element = (await EditorPage({ searchParams: Promise.resolve({ id: 'pgr' }) })) as ReactElement;
    expect(auth.roleCalls).toEqual([[['admin', 'editor'], '/admin/editor', { id: 'pgr' }]]);
    expect(element.type).toBe(ArticleEditor);
  });

  it('/admin/usuarios: só admin; lista paginada com o token do admin, no servidor', async () => {
    const element = (await UsersPage({ searchParams: Promise.resolve({ pagina: '2' }) })) as ReactElement<{
      page: number;
      totalPages: number;
      currentUserId: string;
    }>;
    expect(auth.roleCalls[0][0]).toEqual(['admin']);
    expect(auth.roleCalls[0][1]).toBe('/admin/usuarios');
    expect(users.listCalls[0][0]).toBe('token-do-servidor');
    expect(users.listCalls[0][2]).toEqual({ limit: 20, offset: 20, query: '' });
    expect(element.type).toBe(UsersManager);
    expect(element.props).toMatchObject({ page: 2, totalPages: 3, currentUserId: 'u-1' });
    // O token não vai para o componente cliente.
    expect(JSON.stringify(element.props)).not.toContain('token-do-servidor');
  });

  it('/admin/usuarios: página inválida vira 1', async () => {
    for (const pagina of ['0', '-3', 'abc', '99999999']) {
      users.listCalls = [];
      await UsersPage({ searchParams: Promise.resolve({ pagina }) });
      expect(users.listCalls[0][2]).toEqual({ limit: 20, offset: 0, query: '' });
    }
  });

  it('/admin/usuarios: a busca (?q=) chega ao AuthService e ao componente', async () => {
    users.listCalls = [];
    const element = (await UsersPage({
      searchParams: Promise.resolve({ q: ['  maria  ', 'ignorado'] }),
    })) as ReactElement<{ query: string }>;
    expect(users.listCalls[0][2]).toEqual({ limit: 20, offset: 0, query: 'maria' });
    expect(element.props.query).toBe('maria');

    users.listCalls = [];
    await UsersPage({ searchParams: Promise.resolve({ q: 'x'.repeat(300) }) });
    expect((users.listCalls[0][2] as { query: string }).query).toHaveLength(254);
  });

  it('/admin/usuarios: sessão encerrada no meio → login; AuthService fora → erro', async () => {
    users.result = { ok: false, error: 'unauthenticated' };
    await expect(UsersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(nav.RedirectSignal);
    users.result = { ok: false, error: 'unavailable' };
    await expect(UsersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('unavailable');
  });

  it('/conta/senha: única que abre com a troca pendente; next validado', async () => {
    auth.impl = async () => session('user', true);
    const element = (await ChangePasswordPage({
      searchParams: Promise.resolve({ next: 'https://evil.example' }),
    })) as ReactElement<{ required: boolean; next: string }>;
    expect(auth.sessionCalls[0][2]).toEqual({ allowPendingPasswordChange: true });
    expect(element.type).toBe(ChangePasswordForm);
    expect(element.props).toEqual({ required: true, next: '/conta' });
  });

  it('não renderiza nada quando a autorização interrompe (redirect/403)', async () => {
    auth.impl = async () => {
      throw new Error('interrompido pela autorização: 403');
    };
    await expect(AdminPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('403');
    await expect(EditorPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('403');
    await expect(UsersPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('403');
    expect(users.listCalls).toEqual([]);
  });
});
