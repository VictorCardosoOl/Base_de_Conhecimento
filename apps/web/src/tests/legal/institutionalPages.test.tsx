import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import fs from 'node:fs';
import path from 'node:path';

const telemetry = vi.hoisted(() => ({ initTelemetry: vi.fn(), stopTelemetry: vi.fn() }));
vi.mock('@/features/analytics/telemetry', () => telemetry);

import TermsPage from '@/app/termos/page';
import PrivacyPage from '@/app/privacidade/page';
import CookiesPage from '@/app/cookies/page';
import { LegalPager, legalNeighbors } from '@/features/legal/components/LegalPager';
import { LEGAL_PAGES } from '@/features/legal/institutional';
import { ConsentProvider } from '@/features/consent/ConsentContext';
import { CookiePreferences } from '@/features/consent/components/CookiePreferences';
import { ToastProvider } from '@/components/ui/Toast';
import { ESSENTIAL_ITEMS, FEATURE_ITEMS, MONITORING_ITEMS, clearFeatureData } from '@/features/consent/storage-inventory';
import { PRIVACY_POLICY, TERMS_OF_USE } from '@/features/legal/documents';

// Nome acessível (aria-label quando há; senão o texto) e destino, na ordem da coluna.
const links = (nav: HTMLElement) =>
  within(nav)
    .getAllByRole('link')
    .map((a) => [a.getAttribute('aria-label') ?? a.textContent?.replace(/\s+/g, ' ').trim(), a.getAttribute('href')]);

beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});

describe('navegação contextual entre os documentos', () => {
  it('ordem fixa: Termos → Privacidade → Cookies', () => {
    expect(LEGAL_PAGES.map((page) => page.href)).toEqual(['/termos', '/privacidade', '/cookies']);
    expect(legalNeighbors('/termos')).toMatchObject({ previous: null, next: { href: '/privacidade' } });
    expect(legalNeighbors('/privacidade')).toMatchObject({ previous: { href: '/termos' }, next: { href: '/cookies' } });
    expect(legalNeighbors('/cookies')).toMatchObject({ previous: { href: '/privacidade' }, next: null });
  });

  it('coluna centralizada; HOME em destaque, com o texto visível contido no nome acessível', () => {
    render(<LegalPager current="/privacidade" />);
    const nav = screen.getByRole('navigation', { name: 'Navegação entre documentos' });
    expect(nav.querySelector('ul')!.className).toMatch(/flex-col/);
    expect(nav.querySelector('ul')!.className).toMatch(/items-center/);
    const home = within(nav).getByRole('link', { name: 'Voltar para a Home' });
    expect(home.className).toMatch(/ui-btn--primary/);
    expect(home.textContent).toBe('Home');
  });

  it('Termos: Home e próxima (Privacidade)', () => {
    render(<LegalPager current="/termos" />);
    expect(links(screen.getByRole('navigation', { name: 'Navegação entre documentos' }))).toEqual([
      ['Voltar para a Home', '/'],
      ['Próxima página Política de Privacidade', '/privacidade'],
    ]);
  });

  it('Privacidade: anterior (Termos), Home e próxima (Cookies)', () => {
    render(<LegalPager current="/privacidade" />);
    expect(links(screen.getByRole('navigation', { name: 'Navegação entre documentos' }))).toEqual([
      ['Página anterior Termos de Uso', '/termos'],
      ['Voltar para a Home', '/'],
      ['Próxima página Preferências de Cookie', '/cookies'],
    ]);
  });

  it('Cookies: anterior (Privacidade) e Home', () => {
    render(<LegalPager current="/cookies" />);
    expect(links(screen.getByRole('navigation', { name: 'Navegação entre documentos' }))).toEqual([
      ['Página anterior Política de Privacidade', '/privacidade'],
      ['Voltar para a Home', '/'],
    ]);
  });
});

describe('páginas institucionais', () => {
  it.each([
    ['Termos de Uso', TermsPage, TERMS_OF_USE.sections.length],
    ['Política de Privacidade', PrivacyPage, PRIVACY_POLICY.sections.length],
  ])('%s: título, índice com âncoras para cada seção e navegação', (title, Page, sections) => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
    const toc = screen.getByRole('navigation', { name: 'Nesta página' });
    const anchors = within(toc).getAllByRole('link');
    expect(anchors).toHaveLength(sections);
    for (const anchor of anchors) {
      expect(document.getElementById(anchor.getAttribute('href')!.slice(1))).not.toBeNull();
    }
  });

  it('privacidade cita a LGPD com link oficial e não promete o que não existe', () => {
    render(<PrivacyPage />);
    const refs = screen.getByRole('region', { name: 'Referências oficiais' });
    expect(within(refs).getByRole('link', { name: /Lei nº 13\.709\/2018/ }).getAttribute('href')).toMatch(/^https:\/\/www\.planalto\.gov\.br\//);
    const text = document.body.textContent!;
    for (const forbidden of [/garantimos/i, /absolut/i, /100%/, /invulner/i, /ao navegar.*concorda/i]) {
      expect(text).not.toMatch(forbidden);
    }
  });

  it('cookies: título, três categorias com tabelas e controles', () => {
    render(
      <ToastProvider>
        <ConsentProvider>
          <CookiesPage />
        </ConsentProvider>
      </ToastProvider>
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Preferências de Cookie' })).toBeTruthy();
    expect(screen.getAllByRole('table')).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Salvar preferências' })).toBeTruthy();
    expect(screen.getByRole('link', { name: /Guia orientativo/ }).getAttribute('href')).toMatch(/^https:\/\/www\.gov\.br\/anpd\//);
  });
});

function renderPreferences() {
  return render(
    <ToastProvider>
      <ConsentProvider>
        <CookiePreferences />
      </ConsentProvider>
    </ToastProvider>
  );
}

describe('preferências de cookie (controles reais)', () => {
  it('salvar permite, grava a escolha e o status muda; recusar grava "denied"', async () => {
    renderPreferences();
    expect(screen.getByText('Nenhuma escolha registrada')).toBeTruthy();
    const save = screen.getByRole('button', { name: 'Salvar preferências' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: /^Permitir/ }));
    fireEvent.click(save);
    expect(localStorage.getItem('sst_user_cookie_consent')).toBe('granted');
    expect(screen.getByText('Permitido')).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: /^Não permitir/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar preferências' }));
    expect(localStorage.getItem('sst_user_cookie_consent')).toBe('denied');
    expect((await screen.findAllByText(/Nenhum dado de monitoramento será enviado/)).length).toBeGreaterThan(0);
  });

  it('apagar a escolha remove o registro (o aviso volta)', () => {
    localStorage.setItem('sst_user_cookie_consent', 'granted');
    renderPreferences();
    fireEvent.click(screen.getByRole('button', { name: 'Apagar minha escolha' }));
    expect(localStorage.getItem('sst_user_cookie_consent')).toBeNull();
    expect(screen.getByText('Nenhuma escolha registrada')).toBeTruthy();
  });

  it('apagar dados locais pede confirmação e remove só os dados de recursos', async () => {
    localStorage.setItem('sstfaq_queue', '["a"]');
    localStorage.setItem('isDarkMode', 'true');
    localStorage.setItem('sst_user_cookie_consent', 'denied');
    const reload = vi.fn();
    Object.defineProperty(window, 'location', { value: { ...window.location, reload }, configurable: true });
    renderPreferences();
    await waitFor(() => expect(screen.getByText(/2 itens guardados/)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: 'Apagar dados locais' }));
    const dialog = screen.getByRole('dialog', { name: 'Apagar os dados deste aparelho?' });
    act(() => {
      fireEvent.click(within(dialog).getByRole('button', { name: 'Apagar dados locais' }));
    });
    expect(localStorage.getItem('sstfaq_queue')).toBeNull();
    expect(localStorage.getItem('isDarkMode')).toBeNull();
    expect(localStorage.getItem('sst_user_cookie_consent')).toBe('denied');
    expect(reload).toHaveBeenCalled();
  });

  it('clearFeatureData conta só o que existia', () => {
    localStorage.setItem('sst_reading_goal', '{}');
    expect(clearFeatureData()).toBe(1);
    expect(clearFeatureData()).toBe(0);
  });
});

describe('inventário confere com o código', () => {
  const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
  const sources = [
    'src/features/reading/reading-experience-service.ts',
    'src/features/reading/use-reading-queue.ts',
    'src/features/analytics/analytics-service.ts',
    'src/features/shell/theme-storage.ts',
    'src/features/shell/glass-preference.ts',
    'src/features/consent/consent-storage.ts',
    'src/features/auth/return-guard.ts',
  ]
    .map(read)
    .join('\n');

  it('cada chave de navegador do inventário existe no código', () => {
    for (const item of [...FEATURE_ITEMS, ...ESSENTIAL_ITEMS.filter((i) => i.kind !== 'cookie')]) {
      expect(sources).toContain(`'${item.name}'`);
    }
  });

  it('os cookies e a chave do Sentry são os da configuração padrão e do SDK', () => {
    const config = fs.readFileSync(path.join(process.cwd(), '..', 'api', 'backend', 'core', 'config.py'), 'utf8');
    for (const name of ['__Host-kb_at', '__Secure-kb_rt', '__Secure-kb_oauth_state', '__Secure-kb_oauth_signup']) {
      expect(config).toContain(name);
    }
    expect(read('src/features/analytics/telemetry.ts')).toContain(`'${MONITORING_ITEMS[0].name}'`);
  });
});
