import { describe, it, expect, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import { useRef } from 'react';

vi.mock('@/features/articles/catalog', () => ({
  FAQ_DATA: [
    { id: 'a', question: 'Primeiro', answer: '', category: 'eSocial', date: '' },
    { id: 'x', question: 'De outro módulo', answer: '', category: 'GRO', date: '' },
    { id: 'b', question: 'Segundo', answer: '', category: 'eSocial', date: '' },
    { id: 'c', question: 'Terceiro', answer: '', category: 'eSocial', date: '' },
  ],
}));

import { ArticleNeighbors, neighborsOf } from '@/features/articles/components/ArticleNeighbors';
import { HomeGrid } from '@/features/articles/components/HomeGrid';
import { useReadingProgress } from '@/features/reading/use-reading-progress';

describe('anterior/próximo no mesmo módulo', () => {
  it('pula artigos de outros módulos', () => {
    expect(neighborsOf('b')).toMatchObject({ previous: { id: 'a' }, next: { id: 'c' } });
    expect(neighborsOf('a').previous).toBeNull();
    expect(neighborsOf('c').next).toBeNull();
    expect(neighborsOf('inexistente')).toEqual({ previous: null, next: null });
  });

  it('links para continuar lendo; sozinho no módulo, nada', () => {
    const { unmount } = render(<ArticleNeighbors articleId="b" />);
    const nav = screen.getByRole('navigation', { name: 'Continue lendo' });
    expect(nav.querySelectorAll('a')[0].getAttribute('href')).toBe('/artigo/a');
    expect(nav.querySelectorAll('a')[1].getAttribute('href')).toBe('/artigo/c');
    unmount();
    render(<ArticleNeighbors articleId="x" />);
    expect(screen.queryByRole('navigation', { name: 'Continue lendo' })).toBeNull();
  });
});

describe('seleção de artigos (página inicial)', () => {
  it('título, contagem e pílulas de módulo com o atual marcado', () => {
    render(<HomeGrid categoryParam="eSocial" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Base de Conhecimento' })).toBeTruthy();
    expect(screen.getByText('3 artigos em eSocial')).toBeTruthy();
    const modulos = screen.getByRole('navigation', { name: 'Módulos' });
    const atual = modulos.querySelector('[aria-current="page"]')!;
    expect(atual.textContent).toContain('eSocial');
    expect(screen.getAllByRole('article')).toHaveLength(3);
    // O card abre o artigo por um link de verdade (teclado e prefetch).
    expect(screen.getByRole('link', { name: 'Primeiro' }).getAttribute('href')).toBe('/artigo/a');
  });

  it('módulo sem artigos: mensagem própria', () => {
    render(<HomeGrid categoryParam="Coletivo" />);
    expect(screen.getByText('Nenhum artigo neste módulo ainda.')).toBeTruthy();
  });
});

function ProgressProbe({ withContainer }: { withContainer: boolean }) {
  const bar = useRef<HTMLDivElement>(null);
  const box = useRef<HTMLDivElement>(null);
  useReadingProgress(bar, withContainer ? { container: box } : {});
  return (
    <div ref={box} data-testid="box">
      <div ref={bar} data-testid="bar" />
    </div>
  );
}

describe('useReadingProgress', () => {
  it('escreve scaleX direto no elemento conforme a rolagem do contêiner', async () => {
    render(<ProgressProbe withContainer />);
    const box = screen.getByTestId('box');
    Object.defineProperty(box, 'scrollHeight', { value: 1100, configurable: true });
    Object.defineProperty(box, 'clientHeight', { value: 100, configurable: true });
    box.scrollTop = 500;
    await act(async () => {
      box.dispatchEvent(new Event('scroll'));
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    });
    expect(screen.getByTestId('bar').style.transform).toBe('scaleX(0.5)');
  });
});
