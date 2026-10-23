import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';
import SobrePage from '@/app/sobre/page';
import { SessionSummaryContext } from '@/features/auth/use-session-summary';
import { FAQ_DATA } from '@/features/articles/catalog';

function renderPage(authenticated = false) {
  return render(
    <SessionSummaryContext.Provider
      value={
        authenticated
          ? { authenticated: true, email: 'a@b.c', username: 'a', displayName: 'A', role: 'user', mustChangePassword: false }
          : { authenticated: false }
      }
    >
      <SobrePage />
    </SessionSummaryContext.Provider>
  );
}

// Rotas que existem no app (pastas com page.tsx).
const APP = path.join(process.cwd(), 'src', 'app');
const routeExists = (href: string) => {
  const clean = href.split(/[?#]/)[0];
  if (clean === '/') return true;
  return fs.existsSync(path.join(APP, ...clean.split('/').filter(Boolean), 'page.tsx'));
};

describe('página Sobre', () => {
  it('um único h1 e seções com h2 na ordem da narrativa', () => {
    renderPage();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Por que a Base SST existe',
      'O que você encontra',
      'Como o conteúdo é mantido',
      'Princípios que orientam a plataforma',
      'Quem faz a Base SST',
      'Consultoria técnica',
      'Comece pela busca ou pelos módulos',
    ]);
  });

  it('números do acervo vêm do catálogo', () => {
    renderPage();
    const published = FAQ_DATA.filter((item) => item.category !== 'Sobre');
    expect(screen.getByText('Artigos').nextElementSibling!.textContent).toBe(String(published.length));
    expect(screen.getByText('Módulos').nextElementSibling!.textContent).toBe(String(new Set(published.map((i) => i.category)).size));
  });

  it('todo link interno aponta para uma rota existente ou âncora da página; externos abrem em nova aba', () => {
    renderPage();
    for (const link of screen.getAllByRole('link')) {
      const href = link.getAttribute('href')!;
      if (href.startsWith('#')) {
        expect(document.getElementById(href.slice(1))).not.toBeNull();
      } else if (href.startsWith('/')) {
        expect(routeExists(href)).toBe(true);
      } else if (href.startsWith('http')) {
        expect(link.getAttribute('target')).toBe('_blank');
        expect(link.getAttribute('rel')).toBe('noopener noreferrer');
      } else {
        expect(href).toMatch(/^mailto:/);
      }
    }
  });

  it('não repete afirmações sem respaldo da versão anterior', () => {
    renderPage();
    const text = document.body.textContent!;
    for (const claim of [/SST\s*FAQ/i, /ESTD/i, /turnover/i, /recrutador/i, /PWA/i, /sem depender de bancos/i, /drástic/i, /Foto em breve/i]) {
      expect(text).not.toMatch(claim);
    }
  });

  it('chamada final: cadastro para visitante, conta para quem entrou', () => {
    const { unmount } = renderPage(false);
    const closing = screen.getByRole('region', { name: 'Comece pela busca ou pelos módulos' });
    expect(within(closing).getByRole('link', { name: 'Criar conta' }).getAttribute('href')).toBe('/cadastro');
    unmount();
    renderPage(true);
    expect(
      within(screen.getByRole('region', { name: 'Comece pela busca ou pelos módulos' })).getByRole('link', { name: 'Minha conta' })
    ).toBeTruthy();
  });

  it('Quem faz: Victor e depois Guilherme; em cada bloco, HTML na ordem foto → texto → link', () => {
    renderPage();
    const section = screen.getByRole('region', { name: 'Quem faz a Base SST' });
    const profiles = within(section).getAllByRole('article');
    expect(profiles.map((p) => within(p).getByRole('heading', { level: 3 }).textContent)).toEqual(['Victor Cardoso', 'Guilherme Cruz']);
    for (const [index, profile] of profiles.entries()) {
      const [photo, text] = Array.from(profile.children) as HTMLElement[];
      expect(photo.className).toMatch(/aspect|glass-card/);
      expect(text.contains(within(profile).getByRole('heading', { level: 3 }))).toBe(true);
      expect(text.contains(within(profile).getByRole('link'))).toBe(true);
      // Zigue-zague só visual: no segundo bloco a grade leva a foto para a direita.
      expect(photo.className).toContain(index === 1 ? 'lg:col-start-9' : 'lg:col-start-1');
    }
  });

  it('links das pessoas: destino informado, rótulo com pessoa e tipo, nova aba', () => {
    renderPage();
    const expected: Array<[string, string]> = [
      ['Portfólio de Victor Cardoso', 'https://victor-cardoso.vercel.app'],
      ['Página de links de Guilherme Cruz', 'https://gcruz.dev.br/links'],
      ['LinkedIn de Sabrina Fraguela', 'https://br.linkedin.com/in/sabrinaalvesfraguela'],
      ['GitHub de João Sanchez', 'https://github.com/Juao-crtl-c'],
    ];
    for (const [label, href] of expected) {
      const link = screen.getByRole('link', { name: new RegExp(`^${label}`) });
      expect(link.getAttribute('href')).toBe(href);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('Consultoria: cartões quadrados, cada um com contribuições e um único link', () => {
    renderPage();
    const section = screen.getByRole('region', { name: 'Consultoria técnica' });
    const cards = within(section).getAllByRole('article');
    expect(cards).toHaveLength(2);
    for (const card of cards) {
      expect(card.className).toContain('aspect-square');
      expect(within(card).getAllByRole('link')).toHaveLength(1);
      expect(within(card).getAllByRole('listitem').length).toBeGreaterThan(0);
    }
  });

  it('sem fotos fornecidas: iniciais decorativas, nenhuma imagem sem fonte', () => {
    renderPage();
    expect(document.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getAllByText('VC')[0].getAttribute('aria-hidden')).toBe('true');
  });
});
