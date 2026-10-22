import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';

const nav = vi.hoisted(() => ({ push: vi.fn(), pathname: '/' }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: nav.push }),
  usePathname: () => nav.pathname,
}));

vi.mock('@/features/articles/catalog', () => ({
  FAQ_DATA: [
    { id: 'cat-acidente', question: 'Comunicação de Acidente de Trabalho', answer: 'CAT', category: 'Eventos', date: '' },
    { id: 's2240', question: 'Como enviar o S-2240', answer: 'Condições ambientais', category: 'eSocial', date: '' },
    { id: 'pgr', question: 'O que é o PGR', answer: 'Programa', category: 'GRO', date: '' },
  ],
}));

import { HeaderSearch } from '@/features/search/components/HeaderSearch';

const lupa = () => screen.getByRole('button', { name: 'Pesquisar artigos' });
const campo = () => screen.getByRole('combobox', { name: 'Pesquisar artigos' });

async function abrir() {
  fireEvent.click(lupa());
  await waitFor(() => expect(document.activeElement).toBe(campo()));
}

describe('HeaderSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    nav.pathname = '/';
  });

  it('fechado: só a lupa, sem campo', () => {
    render(<HeaderSearch />);
    expect(lupa().getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('expande, mostra resultados ao digitar e abre o artigo com Enter', async () => {
    render(<HeaderSearch />);
    await abrir();
    expect(campo().getAttribute('aria-expanded')).toBe('false');

    fireEvent.change(campo(), { target: { value: 'acidente' } });
    const lista = await screen.findByRole('listbox', { name: 'Artigos encontrados' });
    expect(lista.textContent).toContain('Comunicação de Acidente de Trabalho');
    expect(campo().getAttribute('aria-expanded')).toBe('true');
    expect(campo().getAttribute('aria-activedescendant')).toBeTruthy();

    fireEvent.keyDown(campo(), { key: 'Enter' });
    expect(nav.push).toHaveBeenCalledWith('/artigo/cat-acidente', { scroll: false });
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('setas navegam pelos resultados e o clique também abre', async () => {
    render(<HeaderSearch />);
    await abrir();
    fireEvent.change(campo(), { target: { value: 'o' } });
    const opcoes = await screen.findAllByRole('option');
    expect(opcoes[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(campo(), { key: 'ArrowDown' });
    expect(screen.getAllByRole('option')[1].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(campo(), { key: 'ArrowUp' });
    fireEvent.keyDown(campo(), { key: 'ArrowUp' });
    const ultima = screen.getAllByRole('option').at(-1)!;
    expect(ultima.getAttribute('aria-selected')).toBe('true');
    fireEvent.click(screen.getAllByRole('option')[0]);
    expect(nav.push).toHaveBeenCalledTimes(1);
  });

  it('sem resultado: avisa e Enter abre a busca completa (Ctrl+K)', async () => {
    const atalho = vi.fn();
    window.addEventListener('keydown', atalho);
    render(<HeaderSearch />);
    await abrir();
    fireEvent.change(campo(), { target: { value: 'zzzzqqq' } });
    expect((await screen.findByRole('status')).textContent).toContain('Nenhum artigo encontrado');
    fireEvent.keyDown(campo(), { key: 'Enter' });
    expect(atalho).toHaveBeenCalledWith(expect.objectContaining({ key: 'k', ctrlKey: true }));
    window.removeEventListener('keydown', atalho);
  });

  it('Esc limpa o termo; o segundo Esc recolhe e devolve o foco à lupa', async () => {
    render(<HeaderSearch />);
    await abrir();
    fireEvent.change(campo(), { target: { value: 'pgr' } });
    fireEvent.keyDown(campo(), { key: 'Escape' });
    expect((campo() as HTMLInputElement).value).toBe('');
    fireEvent.keyDown(campo(), { key: 'Escape' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.activeElement).toBe(lupa());
  });

  it('"×" e clique fora recolhem', async () => {
    render(
      <div>
        <HeaderSearch />
        <p>fora</p>
      </div>
    );
    await abrir();
    fireEvent.click(screen.getByRole('button', { name: 'Fechar pesquisa' }));
    expect(screen.queryByRole('combobox')).toBeNull();

    await abrir();
    act(() => {
      screen.getByText('fora').dispatchEvent(new Event('pointerdown', { bubbles: true }));
    });
    expect(screen.queryByRole('combobox')).toBeNull();
  });
});
