import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/dynamic', () => ({
  default: () =>
    function DitherVeilStub() {
      return <div data-testid="dither-veil" />;
    },
}));

import TermsPage from '@/app/termos/page';
import PrivacyPage from '@/app/privacidade/page';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import {
  PRIVACY_POLICY,
  PRIVACY_VERSION,
  TERMS_OF_USE,
  TERMS_VERSION,
} from '@/features/legal/documents';
import {
  isReservedUsername,
  RESERVED_USERNAMES,
} from '@/features/auth/identity';
import { IdentityFields } from '@/features/auth/components/IdentityFields';

describe('Termos de Uso e Política de Privacidade', () => {
  it('versões no mesmo formato do AuthService (até 20 caracteres)', () => {
    for (const version of [TERMS_VERSION, PRIVACY_VERSION]) {
      expect(version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
    expect(TERMS_OF_USE.version).toBe(TERMS_VERSION);
    expect(PRIVACY_POLICY.version).toBe(PRIVACY_VERSION);
  });

  it.each([
    ['Termos de Uso', TermsPage, TERMS_VERSION],
    ['Política de Privacidade', PrivacyPage, PRIVACY_VERSION],
  ])('%s: título, versão visível e seções', (title, Page, version) => {
    render(<Page />);
    expect(screen.getByRole('heading', { level: 1, name: title })).toBeTruthy();
    expect(screen.getByText(version)).toBeTruthy();
    expect(screen.getByRole('navigation', { name: 'Navegação entre documentos' })).toBeTruthy();
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(
      4
    );
  });

  it('a política lista os dados opcionais e os direitos do titular', () => {
    render(<PrivacyPage />);
    expect(screen.getByText(/organização e área de atuação/)).toBeTruthy();
    expect(screen.getByText(/inclusive a exclusão da sua conta/)).toBeTruthy();
    expect(screen.getByText(/comentários e respostas que publica/)).toBeTruthy();
  });
});

describe('nomes reservados (cópia da lista do AuthService)', () => {
  it.each([
    ['admin', true],
    ['ADMIN', true],
    [' su.por-te ', true],
    ['no_reply', true],
    ['maria.silva', false],
    ['administracao', false],
  ])('%j reservado? %s', (name, reserved) => {
    expect(isReservedUsername(name)).toBe(reserved);
  });

  it('lista sem separadores nem maiúsculas (a comparação os remove)', () => {
    for (const name of RESERVED_USERNAMES) expect(name).toMatch(/^[a-z0-9]+$/);
  });
});

describe('AuthSplitLayout', () => {
  const realMatchMedia = window.matchMedia;
  const realGetContext = HTMLCanvasElement.prototype.getContext;

  afterEach(() => {
    window.matchMedia = realMatchMedia;
    HTMLCanvasElement.prototype.getContext = realGetContext;
  });

  function withWebGL() {
    HTMLCanvasElement.prototype.getContext = vi.fn(
      () => ({}) as RenderingContext
    ) as unknown as typeof HTMLCanvasElement.prototype.getContext;
  }

  function withWidth(wide: boolean) {
    window.matchMedia = vi.fn((query: string) => ({
      matches: wide,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
  }

  it('tela larga com WebGL: mostra a imagem animada', () => {
    withWebGL();
    withWidth(true);
    render(<AuthSplitLayout>conteúdo</AuthSplitLayout>);
    expect(screen.getByTestId('dither-veil')).toBeTruthy();
    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('tela pequena: a imagem nem é carregada', () => {
    withWebGL();
    withWidth(false);
    render(<AuthSplitLayout>conteúdo</AuthSplitLayout>);
    expect(screen.queryByTestId('dither-veil')).toBeNull();
    expect(screen.getByText('conteúdo')).toBeTruthy();
  });

  it('sem matchMedia (navegador antigo): sem imagem, formulário intacto', () => {
    withWebGL();
    // @ts-expect-error simulando navegador sem a API
    window.matchMedia = undefined;
    render(<AuthSplitLayout>conteúdo</AuthSplitLayout>);
    expect(screen.queryByTestId('dither-veil')).toBeNull();
  });
});

describe('IdentityFields: nome reservado', () => {
  const props = {
    idPrefix: 't',
    username: 'suporte',
    displayName: 'Suporte',
    onUsernameChange: () => undefined,
    onDisplayNameChange: () => undefined,
    usernameStatus: 'reserved' as const,
    inputClass: '',
    labelClass: '',
  };

  it('no cadastro público é erro', () => {
    render(<IdentityFields {...props} />);
    expect(screen.getByTestId('username-status').textContent).toBe(
      'Este nome é reservado. Escolha outro.'
    );
    expect(screen.getByLabelText('Usuário').getAttribute('aria-invalid')).toBe(
      'true'
    );
  });

  it('para o administrador é só um aviso', () => {
    render(<IdentityFields {...props} forSomeoneElse />);
    expect(screen.getByTestId('username-status').textContent).toContain(
      'administradores podem usá-lo'
    );
    expect(
      screen.getByLabelText('Usuário').getAttribute('aria-invalid')
    ).toBeNull();
  });
});
