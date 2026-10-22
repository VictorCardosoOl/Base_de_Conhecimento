import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { LazyMount } from '@/components/ui/LazyMount';

// D3 (2026-10-15): o servidor (sem IntersectionObserver) renderizava os filhos e o
// navegador começava pelo espaço reservado. O HTML divergia na hidratação (React #418)
// em toda página de artigo.
function Conteudo() {
  return <section>Avalie e contribua</section>;
}

class FakeObserver {
  observe() {}
  disconnect() {}
}

describe('LazyMount', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('o HTML do servidor é o mesmo da primeira renderização no navegador', async () => {
    // Servidor: sem IntersectionObserver.
    vi.stubGlobal('IntersectionObserver', undefined);
    const html = renderToString(
      <LazyMount>
        <Conteudo />
      </LazyMount>
    );

    // Navegador: com IntersectionObserver.
    vi.stubGlobal('IntersectionObserver', FakeObserver);
    const container = document.createElement('div');
    container.innerHTML = html;
    document.body.appendChild(container);
    const recoverable = vi.fn();
    await act(async () => {
      hydrateRoot(
        container,
        <LazyMount>
          <Conteudo />
        </LazyMount>,
        { onRecoverableError: recoverable }
      );
    });
    expect(recoverable).not.toHaveBeenCalled();
    container.remove();
  });

  it('sem IntersectionObserver no navegador, monta os filhos logo depois de abrir', async () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const container = document.createElement('div');
    document.body.appendChild(container);
    const { createRoot } = await import('react-dom/client');
    await act(async () => {
      createRoot(container).render(
        <LazyMount>
          <Conteudo />
        </LazyMount>
      );
    });
    expect(container.textContent).toBe('Avalie e contribua');
    container.remove();
  });
});
