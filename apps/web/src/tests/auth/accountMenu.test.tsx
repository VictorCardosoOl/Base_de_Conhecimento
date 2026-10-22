import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';

const nav = vi.hoisted(() => ({ pathname: '/' as string | null }));
vi.mock('next/navigation', () => ({ usePathname: () => nav.pathname }));

const auth = vi.hoisted(() => ({ logout: vi.fn(async () => true) }));
vi.mock('@/features/auth/client', () => auth);
const navigation = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => navigation);

import { AccountMenu } from '@/features/auth/components/AccountMenu';
import type { ClientSessionSummary } from '@/features/auth/use-session-summary';
import { accountEntryNext, initialsFromEmail, roleLabel } from '@/features/auth/presentation';

const ANON: ClientSessionSummary = { authenticated: false };
const as = (role: string, email = `${role}.pessoa@empresa.com.br`): ClientSessionSummary => ({
  authenticated: true,
  email,
  username: `${role}.pessoa`,
  displayName: `Pessoa ${role}`,
  role,
  mustChangePassword: false,
});

/** Abre o menu e devolve o painel. */
function openPanel(name: string | RegExp) {
  const button = screen.getByRole('button', { name });
  fireEvent.click(button);
  return within(document.getElementById(button.getAttribute('aria-controls')!)!);
}

describe('apresentação da conta', () => {
  it('rótulos de papel, iniciais e destino depois de entrar', () => {
    expect([roleLabel('admin'), roleLabel('editor'), roleLabel('user')]).toEqual(['Administrador', 'Editor', 'Leitor']);
    expect(initialsFromEmail('maria.silva@empresa.com.br')).toBe('MS');
    expect(initialsFromEmail('admin@teste.local')).toBe('A');
    expect(accountEntryNext('/')).toBe('/conta');
    expect(accountEntryNext('/login')).toBe('/conta');
    expect(accountEntryNext('/cadastro')).toBe('/conta');
    expect(accountEntryNext('/artigo/pgr')).toBe('/artigo/pgr');
    expect(accountEntryNext(null)).toBe('/conta');
  });
});

describe('AccountMenu (cabeçalho da navegação)', () => {
  beforeEach(() => {
    nav.pathname = '/artigo/pgr';
    auth.logout.mockClear();
    navigation.hardNavigate.mockClear();
  });

  it('sinal de hidratação: "loading" enquanto a sessão carrega, "ready" depois', () => {
    const { rerender } = render(<AccountMenu session={null} />);
    expect(screen.getByTestId('account-menu').getAttribute('data-session')).toBe('loading');
    rerender(<AccountMenu session={ANON} />);
    expect(screen.getByTestId('account-menu').getAttribute('data-session')).toBe('ready');
  });

  it('visitante: "Entrar" e "Criar conta", voltando para a página atual', () => {
    render(<AccountMenu session={ANON} />);
    const panel = openPanel('Entrar ou criar conta');
    expect(panel.getByRole('link', { name: 'Entrar' }).getAttribute('href')).toBe('/login?next=%2Fartigo%2Fpgr');
    expect(panel.getByRole('link', { name: 'Criar conta' }).getAttribute('href')).toBe('/cadastro?next=%2Fartigo%2Fpgr');
    expect(panel.queryByRole('button', { name: 'Sair' })).toBeNull();
  });

  it('abre e fecha: Esc fecha e devolve o foco ao botão; clique fora fecha', () => {
    render(<AccountMenu session={ANON} />);
    const button = screen.getByRole('button', { name: 'Entrar ou criar conta' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByText('Entrar / Cadastrar', { selector: 'span[aria-hidden="true"]' })).toBeTruthy();

    fireEvent.click(button);
    expect(button.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(button.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(button);

    fireEvent.click(button);
    fireEvent.mouseDown(document.body);
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('com sessão: identificação, papel, atalhos e sair', async () => {
    render(<AccountMenu session={as('editor', 'maria.silva@empresa.com.br')} />);
    const panel = openPanel('Conta de maria.silva@empresa.com.br (Editor)');
    expect(panel.getByText('Pessoa editor')).toBeTruthy();
    expect(panel.getByText('@editor.pessoa · maria.silva@empresa.com.br')).toBeTruthy();
    expect(panel.getByText('Editor')).toBeTruthy();
    expect(panel.getByRole('link', { name: 'Minha conta' }).getAttribute('href')).toBe('/conta');
    expect(panel.getByRole('link', { name: 'Painel' }).getAttribute('href')).toBe('/admin');
    expect(panel.queryByRole('link', { name: 'Usuários' })).toBeNull();
    expect(panel.queryByRole('link', { name: 'Entrar' })).toBeNull();

    await act(async () => {
      fireEvent.click(panel.getByRole('button', { name: 'Sair' }));
    });
    expect(auth.logout).toHaveBeenCalled();
    expect(navigation.hardNavigate).toHaveBeenCalledWith('/login');
  });

  it('admin vê "Usuários"; leitor não vê painel nem usuários', () => {
    const { unmount } = render(<AccountMenu session={as('admin')} />);
    expect(openPanel(/^Conta de/).getByRole('link', { name: 'Usuários' }).getAttribute('href')).toBe('/admin/usuarios');
    unmount();
    render(<AccountMenu session={as('user')} />);
    const panel = openPanel(/^Conta de/);
    expect(panel.queryByRole('link', { name: 'Painel' })).toBeNull();
    expect(panel.queryByRole('link', { name: 'Usuários' })).toBeNull();
  });

  it('carregando: avisa sem mostrar "Entrar" para quem pode estar logado', () => {
    render(<AccountMenu session={null} />);
    const panel = openPanel('Conta');
    expect(panel.getByRole('status').textContent).toContain('Verificando');
    expect(panel.queryByRole('link', { name: 'Entrar' })).toBeNull();
  });
});
