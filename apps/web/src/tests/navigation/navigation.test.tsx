import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRef } from 'react';

const nav = vi.hoisted(() => ({
  pathname: '/',
  search: new URLSearchParams(),
  push: vi.fn(),
}));
vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.search,
  useRouter: () => ({ push: nav.push }),
}));

vi.mock('@/features/articles/catalog', () => ({
  FAQ_DATA: Array.from({ length: 10 }, (_, i) => ({
    id: `esocial-${i}`,
    question: `Artigo eSocial ${i}`,
    answer: '',
    category: 'eSocial',
    date: '',
  })).concat([{ id: 'gro-1', question: 'O que é o PGR', answer: '', category: 'GRO', date: '' }]),
}));

vi.mock('@/features/auth/components/AccountMenu', () => ({
  AccountMenu: () => <button type="button">Conta</button>,
}));
vi.mock('@/features/search/components/HeaderSearch', () => ({ HeaderSearch: () => null }));

import { NavDrawer } from '@/features/navigation/components/NavDrawer';
import { AppHeader } from '@/features/navigation/components/AppHeader';
import { Sidebar } from '@/features/navigation/components/Sidebar';
import { Category } from '@/features/articles/types';
import { ToastProvider } from '@/components/ui/Toast';

function drawer(overrides: Partial<React.ComponentProps<typeof NavDrawer>> = {}) {
  const props = {
    id: 'nav-drawer',
    open: true,
    currentCategory: null,
    queueCount: 0,
    onSelectCategory: vi.fn(),
    onSelectQueue: vi.fn(),
    onOpenAbout: vi.fn(),
    onOpenPrivacy: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  };
  render(<NavDrawer {...props} />);
  return props;
}

beforeEach(() => {
  vi.clearAllMocks();
  nav.pathname = '/';
  nav.search = new URLSearchParams();
});

describe('NavDrawer (menu lateral)', () => {
  it('lista os módulos com a contagem e filtra ao escolher', () => {
    const props = drawer();
    const esocial = screen.getByRole('button', { name: 'Filtrar por módulo eSocial' });
    expect(esocial.textContent).toContain('10');
    expect(screen.queryByRole('button', { name: 'Filtrar por módulo Sobre' })).toBeNull();
    fireEvent.click(esocial);
    expect(props.onSelectCategory).toHaveBeenCalledWith(Category.ESOCIAL);
  });

  it('o módulo ativo vem da URL (as pílulas da página e o menu concordam)', () => {
    nav.search = new URLSearchParams({ category: 'GRO' });
    drawer();
    expect(screen.getByRole('button', { name: 'Filtrar por módulo GRO' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('button', { name: 'Filtrar por módulo eSocial' }).getAttribute('aria-current')).toBeNull();
  });

  it('a seta mostra os artigos do módulo (até 8) e o "ver todos"; recolhido sai do Tab', () => {
    const props = drawer();
    const expand = screen.getByRole('button', { name: 'Ver artigos de eSocial' });
    const list = document.getElementById(expand.getAttribute('aria-controls')!)!;
    expect(list.querySelector('ul')!.hasAttribute('inert')).toBe(true);

    fireEvent.click(expand);
    expect(expand.getAttribute('aria-expanded')).toBe('true');
    expect(list.querySelector('ul')!.hasAttribute('inert')).toBe(false);
    expect(list.querySelectorAll('a')).toHaveLength(8);
    expect(list.querySelector('a')!.getAttribute('href')).toBe('/artigo/esocial-0');

    fireEvent.click(screen.getByRole('button', { name: 'Ver todos os 10 artigos' }));
    expect(props.onSelectCategory).toHaveBeenCalledWith(Category.ESOCIAL);
  });

  it('lendo um artigo: o módulo dele abre sozinho e o artigo fica marcado (e dá para recolher)', () => {
    nav.pathname = '/artigo/esocial-3';
    drawer();
    const expand = screen.getByRole('button', { name: 'Ocultar artigos de eSocial' });
    expect(screen.getByRole('link', { name: 'Artigo eSocial 3' }).getAttribute('aria-current')).toBe('page');
    fireEvent.click(expand);
    expect(screen.getByRole('button', { name: 'Ver artigos de eSocial' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('clique na seta do módulo: expande e recolhe os artigos', () => {
    drawer();
    const expand = screen.getByRole('button', { name: 'Ver artigos de eSocial' });
    expect(expand.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(expand);
    expect(screen.getByRole('button', { name: 'Ocultar artigos de eSocial' }).getAttribute('aria-expanded')).toBe('true');

    fireEvent.click(screen.getByRole('button', { name: 'Ocultar artigos de eSocial' }));
    expect(screen.getByRole('button', { name: 'Ver artigos de eSocial' }).getAttribute('aria-expanded')).toBe('false');
  });

  it('fechado: fora do Tab e dos leitores de tela', () => {
    drawer({ open: false });
    const panel = document.getElementById('nav-drawer')!;
    expect(panel.hasAttribute('inert')).toBe(true);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(panel.hasAttribute('data-open')).toBe(false);
  });

  it('atalhos: lista (com contagem), sobre e privacidade', () => {
    const props = drawer({ queueCount: 3 });
    fireEvent.click(screen.getByRole('button', { name: /Minha Lista/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sobre o Projeto' }));
    fireEvent.click(screen.getByRole('button', { name: 'LGPD e privacidade' }));
    expect(props.onSelectQueue).toHaveBeenCalled();
    expect(props.onOpenAbout).toHaveBeenCalled();
    expect(props.onOpenPrivacy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Minha Lista/ }).textContent).toContain('3');
  });
});

describe('AppHeader', () => {
  const base = {
    drawerId: 'nav-drawer',
    onToggleDrawer: vi.fn(),
    queueCount: 2,
    isDarkMode: false,
    onToggleTheme: vi.fn(),
    onAlerts: vi.fn(),
    onHome: vi.fn(),
    accountSlot: null,
  };

  it('botão do menu com nome e estado; tema e lista com rótulos da ação', () => {
    const { rerender } = render(<AppHeader {...base} drawerOpen={false} toggleRef={createRef()} />);
    const toggle = screen.getByRole('button', { name: 'Abrir menu' });
    expect(toggle.getAttribute('aria-controls')).toBe('nav-drawer');
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('button', { name: 'Ativar modo escuro' }).getAttribute('aria-pressed')).toBe('false');
    expect(screen.getByRole('link', { name: 'Minha Lista (2 itens salvos)' })).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Início' }).getAttribute('href')).toBe('/');

    rerender(<AppHeader {...base} drawerOpen isDarkMode toggleRef={createRef()} />);
    expect(screen.getByRole('button', { name: 'Fechar menu' }).getAttribute('aria-expanded')).toBe('true');
    expect(screen.getByRole('button', { name: 'Ativar modo claro' }).getAttribute('aria-pressed')).toBe('true');
  });

  it('rolando: fica denso depois de 24px e some ao descer (volta ao subir)', async () => {
    render(<AppHeader {...base} drawerOpen={false} toggleRef={createRef()} />);
    const header = screen.getByRole('banner');
    const scrollTo = async (y: number) => {
      Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
      await act(async () => {
        window.dispatchEvent(new Event('scroll'));
        await new Promise((r) => requestAnimationFrame(() => r(null)));
      });
    };
    await scrollTo(30);
    expect(header.hasAttribute('data-scrolled')).toBe(true);
    await scrollTo(400);
    expect(header.hasAttribute('data-hidden')).toBe(true);
    await scrollTo(300);
    expect(header.hasAttribute('data-hidden')).toBe(false);
    await scrollTo(0);
    expect(header.hasAttribute('data-scrolled')).toBe(false);
  });
});

describe('Sidebar (cabeçalho + menu)', () => {
  const props = {
    currentCat: null,
    onSelect: vi.fn(),
    isDarkMode: false,
    toggleDark: vi.fn(),
    onSelectQueue: vi.fn(),
  };

  it('abre pelo botão; Esc fecha e devolve o foco ao botão', async () => {
    render(<Sidebar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    expect(document.getElementById('nav-drawer')!.hasAttribute('data-open')).toBe(true);
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Filtrar por módulo GRO' }))
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('nav-drawer')!.hasAttribute('data-open')).toBe(false);
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Abrir menu' }));
  });

  it('escolher um módulo filtra e fecha; LGPD e privacidade abre os Termos de Uso (entrada dos documentos)', () => {
    render(<Sidebar {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'Filtrar por módulo GRO' }));
    expect(props.onSelect).toHaveBeenCalledWith(Category.GRO);
    expect(document.getElementById('nav-drawer')!.hasAttribute('data-open')).toBe(false);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    fireEvent.click(screen.getByRole('button', { name: 'LGPD e privacidade' }));
    expect(nav.push).toHaveBeenCalledWith('/termos');
  });

  it('alertas sem suporte do navegador: avisa', async () => {
    const original = (window as { Notification?: unknown }).Notification;
    delete (window as { Notification?: unknown }).Notification;
    render(
      <ToastProvider>
        <Sidebar {...props} />
      </ToastProvider>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Alertas' }));
    expect((await screen.findByRole('status')).textContent).toContain('não possui suporte');
    (window as { Notification?: unknown }).Notification = original;
  });
});
