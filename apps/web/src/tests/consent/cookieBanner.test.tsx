import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// O jsdom não roda as animações do GSAP: aqui elas terminam na hora (o comportamento
// real, com animação, é coberto pelos testes ponta a ponta no navegador).
vi.mock('gsap', () => {
  const gsap = {
    to: (_target: unknown, vars: { onComplete?: () => void }) => vars.onComplete?.(),
    fromTo: () => undefined,
  };
  return { default: gsap, gsap };
});
vi.mock('@gsap/react', async () => {
  const { useLayoutEffect } = await import('react');
  return {
    useGSAP: (fn: () => void, deps?: unknown[]) =>
      // eslint-disable-next-line react-hooks/exhaustive-deps
      useLayoutEffect(() => fn(), deps),
  };
});
import { ConsentProvider } from '@/features/consent/ConsentContext';
import { CookieBanner } from '@/features/consent/components/CookieBanner';

const reserved = () => document.documentElement.style.getPropertyValue('--cookie-banner-h');

function renderBanner() {
  return render(
    <ConsentProvider>
      <CookieBanner />
    </ConsentProvider>
  );
}

describe('CookieBanner', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--cookie-banner-h');
  });

  it('enquanto visível, reserva o espaço que ocupa (conteúdo não fica preso atrás dele)', () => {
    renderBanner();
    expect(screen.getByRole('region', { name: /cookies e privacidade/i })).not.toBeNull();
    expect(reserved()).toMatch(/^\d+px$/);
  });

  it('recusar persiste a escolha, some e libera o espaço reservado', async () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: /cookies e privacidade/i })).toBeNull());
    expect(localStorage.getItem('sst_user_cookie_consent')).toBe('denied');
    expect(reserved()).toBe('');
  });

  it('aceitar persiste a escolha', async () => {
    renderBanner();
    fireEvent.click(screen.getByRole('button', { name: 'Permitir monitoramento' }));
    await waitFor(() => expect(screen.queryByRole('region', { name: /cookies e privacidade/i })).toBeNull());
    expect(localStorage.getItem('sst_user_cookie_consent')).toBe('granted');
  });

  it('escolha já feita: não exibe nem reserva espaço', () => {
    localStorage.setItem('sst_user_cookie_consent', 'denied');
    renderBanner();
    expect(screen.queryByRole('region', { name: /cookies e privacidade/i })).toBeNull();
    expect(reserved()).toBe('');
  });

  it('ações são botões nativos, alcançáveis por teclado', () => {
    renderBanner();
    for (const name of ['Permitir monitoramento', 'Recusar']) {
      const button = screen.getByRole('button', { name });
      button.focus();
      expect(document.activeElement).toBe(button);
      expect(button.getAttribute('type')).toBe('button');
    }
  });
});
