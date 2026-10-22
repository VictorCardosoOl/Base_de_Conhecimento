import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';

vi.mock('@/features/articles/catalog', () => ({
  FAQ_DATA: [
    { id: 'a', question: 'Antigo', answer: '', category: 'eSocial', date: '15 Out 2024' },
    { id: 'b', question: 'Mais novo', answer: '', category: 'GRO', date: '04 Sep 2026' },
    { id: 'c', question: 'Do meio', answer: '', category: 'eSocial', date: '10 Jan 2026' },
    { id: 's', question: 'Sobre', answer: '', category: 'Sobre', date: '20 Sep 2026' },
  ],
}));


import { Footer } from '@/features/navigation/components/Footer';
import { SessionSummaryContext } from '@/features/auth/use-session-summary';


describe('Footer', () => {
  it('créditos com links para os portfólios, em nova aba e com aviso acessível', () => {
    render(<Footer />);
    const victor = screen.getByRole('link', { name: /Victor Cardoso/ });
    const guilherme = screen.getByRole('link', { name: /Guilherme Cruz/ });
    expect(victor.getAttribute('href')).toBe('https://victor-cardoso.vercel.app');
    expect(guilherme.getAttribute('href')).toBe('https://gcruz.dev.br');
    for (const link of [victor, guilherme]) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      expect(link.textContent).toContain('(abre em nova aba)');
    }
    expect(victor.closest('p')!.textContent).toMatch(/Design by Victor Cardoso.*and Guilherme Cruz/);
  });

  it('ordem da faixa inferior: copyright e créditos, versão, links institucionais', () => {
    render(<Footer />);
    const legal = screen.getByRole('navigation', { name: 'Documentos legais' });
    const bar = legal.parentElement!;
    const [credits, version, last] = Array.from(bar.children);
    expect(credits.textContent).toMatch(/^© \d{4} Base SST · Design by Victor Cardoso.*and Guilherme Cruz/);
    expect(within(version as HTMLElement).getByRole('button', { name: 'Versão v2.0.0: copiar' }).textContent).toBe('v2.0.0');
    expect(last).toBe(legal);
    expect(within(legal).getAllByRole('link').map((l) => [l.textContent, l.getAttribute('href')])).toEqual([
      ['Termos de uso', '/termos'],
      ['Privacidade', '/privacidade'],
      ['Preferências de cookie', '/cookies'],
    ]);
  });

  it('botão da versão copia v2.0.0 e confirma', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(<Footer />);
    fireEvent.click(screen.getByRole('button', { name: 'Versão v2.0.0: copiar' }));
    expect(writeText).toHaveBeenCalledWith('v2.0.0');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Versão v2.0.0: copiar' }).querySelector('svg')).not.toBeNull());
  });

  it('sem preferências de efeitos visuais (ficam em Minha conta)', () => {
    render(<Footer />);
    expect(screen.queryByText('Efeitos visuais')).toBeNull();
    expect(screen.queryByRole('radio')).toBeNull();
  });

  it('números, módulos com contagem e recentes vêm do catálogo (sem "Sobre")', () => {
    render(<Footer />);
    expect(screen.getByText('Artigos').nextElementSibling!.textContent).toBe('3');
    expect(screen.getByText('Módulos', { selector: 'dt' }).nextElementSibling!.textContent).toBe('2');
    const modules = screen.getByRole('navigation', { name: 'Módulos' });
    expect(within(modules).getByRole('link', { name: /eSocial/ }).textContent).toContain('2');
    const recent = within(screen.getByRole('navigation', { name: 'Atualizados recentemente' })).getAllByRole('link');
    expect(recent.map((link) => link.getAttribute('href'))).toEqual(['/artigo/b', '/artigo/c', '/artigo/a']);
  });

  it('atalhos de conta conforme a sessão', () => {
    const { unmount } = render(<Footer />);
    expect(screen.getByRole('link', { name: 'Criar conta' }).getAttribute('href')).toBe('/cadastro');
    unmount();

    render(
      <SessionSummaryContext.Provider
        value={{ authenticated: true, email: 'a@b.c', username: 'a', displayName: 'A', role: 'user', mustChangePassword: false }}
      >
        <Footer />
      </SessionSummaryContext.Provider>
    );
    expect(screen.getByRole('link', { name: 'Minha conta' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Criar conta' })).toBeNull();
  });
});
