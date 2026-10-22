import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// A página /conta com autorização e partes interativas substituídas por stubs: o teste
// cobre o texto da área "Sair de todos os dispositivos".
vi.mock('@/features/auth/session', () => ({
  CONTENT_ROLES: ['admin', 'editor'],
  loadSessionDeps: async () => ({ config: { internalUrl: 'http://auth.internal' } }),
  requireSession: async () => ({
    accessToken: 'token-de-teste',
    user: {
      id: 'u1',
      email: 'pessoa@empresa.com.br',
      username: 'pessoa',
      displayName: 'Pessoa Teste',
      role: 'editor',
      mustChangePassword: false,
      emailVerified: true,
      hasPassword: true,
    },
  }),
}));
vi.mock('@/features/auth/users', () => ({ getOwnRoleRequest: async () => ({ ok: true, value: null }) }));
vi.mock('@/features/auth/components/LogoutButton', () => ({
  LogoutButton: ({ children = 'Sair' }: { children?: React.ReactNode }) => <button type="button">{children}</button>,
}));
vi.mock('@/app/conta/EditorAccessRequest', () => ({ EditorAccessRequest: () => null }));
vi.mock('@/app/conta/EmailVerificationStatus', () => ({ EmailVerificationStatus: () => null }));
vi.mock('@/app/conta/ReadingQueueTile', () => ({ ReadingQueueTile: () => null }));
vi.mock('@/app/conta/MyCorrections', () => ({ MyCorrections: () => null }));
vi.mock('@/features/shell/components/GlassPreferenceControl', () => ({ GlassPreferenceControl: () => null }));
vi.mock('@/components/ui/glass/GlassMetrics', () => ({ RingGauge: () => null }));

import AccountPage from '@/app/conta/page';

describe('Minha conta', () => {
  it('explica que limpar parte dos dados do site não encerra a sessão (U1)', async () => {
    render(await AccountPage({ searchParams: Promise.resolve({}) }));
    expect(screen.getByRole('button', { name: 'Sair de todos os dispositivos' })).toBeTruthy();
    const area = screen.getByRole('button', { name: 'Sair de todos os dispositivos' }).parentElement!;
    expect(area.textContent).toContain('Limpar só parte dos dados do site no navegador não encerra a sessão');
    expect(area.textContent).not.toMatch(/[—–]/);
  });
});
