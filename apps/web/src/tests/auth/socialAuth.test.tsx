import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const auth = vi.hoisted(() => ({
  fetchSocialProviders: vi.fn(),
  fetchPendingSocialSignup: vi.fn(),
  completeSocialSignup: vi.fn(),
  cancelSocialSignup: vi.fn(),
}));
vi.mock('@/features/auth/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/client')>()),
  ...auth,
}));

const identity = vi.hoisted(() => ({ checkUsernameAvailability: vi.fn() }));
vi.mock('@/features/auth/identity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/identity')>()),
  checkUsernameAvailability: identity.checkUsernameAvailability,
}));

import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { SocialSignupForm } from '@/app/cadastro/social/SocialSignupForm';
import { oauthErrorMessage } from '@/features/auth/oauth-errors';
import LoginPage from '@/app/login/page';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/features/legal/documents';

beforeEach(() => {
  vi.clearAllMocks();
  identity.checkUsernameAvailability.mockResolvedValue('available');
});

describe('SocialLoginButtons', () => {
  it('carregando: anuncia e reserva o espaço', () => {
    auth.fetchSocialProviders.mockReturnValue(new Promise(() => undefined));
    render(<SocialLoginButtons next="/conta" mode="login" />);
    expect(screen.getByRole('status').textContent).toContain(
      'Carregando opções de login social'
    );
  });

  it.each([[[]], [null]])(
    'sem provedor configurado (%j): só email e senha',
    async (providers) => {
      auth.fetchSocialProviders.mockResolvedValue(providers);
      render(<SocialLoginButtons next="/conta" mode="login" />);
      await waitFor(() =>
        expect(screen.queryByTestId('social-loading')).toBeNull()
      );
      expect(screen.queryByRole('link')).toBeNull();
      expect(screen.queryByRole('separator')).toBeNull();
    }
  );

  it('um link por provedor (state e PKCE ficam com o AuthService) e o divisor', async () => {
    auth.fetchSocialProviders.mockResolvedValue([
      { id: 'google', name: 'Google' },
      { id: 'github', name: 'GitHub' },
      { id: 'microsoft', name: 'Microsoft' },
    ]);
    render(<SocialLoginButtons next="/artigo/x?y=1" mode="login" />);

    const google = await screen.findByRole('link', {
      name: 'Entrar com Google',
    });
    expect(google.getAttribute('href')).toBe(
      '/auth/oauth/google/start?next=%2Fartigo%2Fx%3Fy%3D1'
    );
    expect(
      screen.getByRole('link', { name: 'Entrar com GitHub' })
    ).toBeTruthy();
    // Provedor novo sem ícone próprio usa um ícone genérico.
    expect(
      screen
        .getByRole('link', { name: 'Entrar com Microsoft' })
        .querySelector('svg')
    ).toBeTruthy();
    expect(
      screen.getByRole('separator', { name: 'ou entre com email e senha' })
    ).toBeTruthy();
  });

  it('ao clicar, indica o redirecionamento e bloqueia os outros botões', async () => {
    auth.fetchSocialProviders.mockResolvedValue([
      { id: 'google', name: 'Google' },
      { id: 'github', name: 'GitHub' },
    ]);
    render(<SocialLoginButtons next="/" mode="signup" />);
    const google = await screen.findByRole('link', {
      name: 'Cadastrar com Google',
    });
    google.addEventListener('click', (event) => event.preventDefault()); // jsdom não navega
    fireEvent.click(google);

    expect(google.textContent).toBe('Abrindo Google…');
    expect(google.getAttribute('aria-busy')).toBe('true');
    const github = screen.getByRole('link', { name: 'Cadastrar com GitHub' });
    expect(github.getAttribute('aria-disabled')).toBe('true');
    const second = new MouseEvent('click', { bubbles: true, cancelable: true });
    github.dispatchEvent(second);
    expect(second.defaultPrevented).toBe(true);
  });
});

describe('erros do login social', () => {
  it.each([
    ['oauth_state', 'expirou ou foi iniciada em outra aba'],
    ['oauth_link_requires_verification', 'confirme o email em Minha conta'],
    ['oauth_email_unverified', 'não confirmou o seu email'],
    ['oauth_denied', 'cancelado'],
  ])('%s tem mensagem própria', (code, message) => {
    expect(oauthErrorMessage(code)).toContain(message);
  });

  it.each(['toString', 'oauth_<script>', '', undefined, ['oauth_state']])(
    'código desconhecido (%j) é ignorado',
    (code) => {
      expect(oauthErrorMessage(code)).toBeNull();
    }
  );

  it('a página de login transforma erro e aviso em mensagens fixas', async () => {
    const page = (await LoginPage({
      searchParams: Promise.resolve({
        erro: 'oauth_denied',
        aviso: 'senha-redefinida',
        next: '/x',
      }),
    })) as ReactElement<{
      next: string;
      initialError: string | null;
      notice: string | null;
    }>;
    expect(page.props.initialError).toContain('cancelado');
    expect(page.props.notice).toBe('Senha redefinida. Entre com a nova senha.');

    const unknown = (await LoginPage({
      searchParams: Promise.resolve({ erro: 'qualquer', aviso: 'constructor' }),
    })) as ReactElement<{ initialError: string | null; notice: string | null }>;
    expect(unknown.props.initialError).toBeNull();
    expect(unknown.props.notice).toBeNull();
  });
});

describe('SocialSignupForm (/cadastro/social)', () => {
  const PENDING = {
    provider: 'google',
    providerName: 'Google',
    email: 'maria@gmail.com',
    suggestedDisplayName: 'Maria Souza',
    suggestedUsername: 'maria',
  };
  const termsBox = () =>
    screen.getByRole('checkbox', { name: /Li e aceito os Termos de Uso/ });
  const status = () => screen.getByTestId('username-status').textContent ?? '';

  it('sem cadastro pendente: orienta a recomeçar', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: false,
      reason: 'none',
    });
    render(<SocialSignupForm />);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'expirou ou já foi concluído'
    );
    expect(
      screen.getByRole('link', { name: 'Voltar ao cadastro' })
    ).toBeTruthy();
  });

  it('serviço fora do ar', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: false,
      reason: 'unavailable',
    });
    render(<SocialSignupForm />);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'indisponível'
    );
  });

  it('mostra o email do provedor, sugere usuário e nome e exige os termos', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: true,
      pending: PENDING,
    });
    auth.completeSocialSignup.mockResolvedValue({
      ok: true,
      user: {},
      nextPath: '/minha-lista',
    });
    render(<SocialSignupForm />);

    expect((await screen.findByTestId('social-email')).textContent).toBe(
      'maria@gmail.com'
    );
    expect(screen.getByText(/Você entrou com Google/)).toBeTruthy();
    expect((screen.getByLabelText('Usuário') as HTMLInputElement).value).toBe(
      'maria'
    );
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe(
      'Maria Souza'
    );
    await waitFor(() => expect(status()).toBe('Disponível.'));

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Corrija os campos'
    );
    expect(termsBox().getAttribute('aria-invalid')).toBe('true');
    expect(auth.completeSocialSignup).not.toHaveBeenCalled();

    fireEvent.click(termsBox());
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith('/minha-lista')
    );
    expect(auth.completeSocialSignup).toHaveBeenCalledWith({
      username: 'maria',
      displayName: 'Maria Souza',
      acceptTerms: true,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      organization: '',
      professionalArea: '',
    });
  });

  it('destino devolvido pelo servidor também é validado', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: true,
      pending: PENDING,
    });
    auth.completeSocialSignup.mockResolvedValue({
      ok: true,
      user: {},
      nextPath: '//evil.example',
    });
    render(<SocialSignupForm />);
    await screen.findByTestId('social-email');
    fireEvent.click(termsBox());
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith('/conta')
    );
  });

  it('sem sugestões: campos vazios; usuário ocupado no envio marca o campo', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: true,
      pending: {
        ...PENDING,
        suggestedUsername: null,
        suggestedDisplayName: null,
      },
    });
    auth.completeSocialSignup.mockResolvedValue({
      ok: false,
      reason: 'username_taken',
    });
    render(<SocialSignupForm />);
    await screen.findByTestId('social-email');
    expect((screen.getByLabelText('Usuário') as HTMLInputElement).value).toBe(
      ''
    );

    fireEvent.change(screen.getByLabelText('Usuário'), {
      target: { value: 'maria.s' },
    });
    fireEvent.change(screen.getByLabelText('Nome'), {
      target: { value: 'Maria' },
    });
    fireEvent.click(termsBox());
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(status()).toContain('já está em uso'));
    expect(nav.hardNavigate).not.toHaveBeenCalled();
  });

  it.each([
    [{ ok: false, reason: 'terms_outdated' }, 'foram atualizados'],
    [
      { ok: false, reason: 'email_taken' },
      'Já existe uma conta com este email',
    ],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 30 }, 'em 30 s'],
  ])('falha %j: mensagem própria', async (result, message) => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: true,
      pending: PENDING,
    });
    auth.completeSocialSignup.mockResolvedValue(result);
    render(<SocialSignupForm />);
    await screen.findByTestId('social-email');
    fireEvent.click(termsBox());
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain(message);
  });

  it('cadastro vencido no envio: troca o formulário pela orientação', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: true,
      pending: PENDING,
    });
    auth.completeSocialSignup.mockResolvedValue({
      ok: false,
      reason: 'expired',
    });
    render(<SocialSignupForm />);
    await screen.findByTestId('social-email');
    fireEvent.click(termsBox());
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain('expirou');
    expect(screen.queryByRole('button', { name: 'Criar conta' })).toBeNull();
  });

  it('cancelar apaga o cadastro pendente e volta ao login', async () => {
    auth.fetchPendingSocialSignup.mockResolvedValue({
      ok: true,
      pending: PENDING,
    });
    auth.cancelSocialSignup.mockResolvedValue(undefined);
    render(<SocialSignupForm />);
    await screen.findByTestId('social-email');
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith('/login')
    );
    expect(auth.cancelSocialSignup).toHaveBeenCalled();
  });
});

describe('cliente: login social', () => {
  afterEach(() => vi.unstubAllGlobals());

  const reply = (status: number, body?: unknown) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  async function actual() {
    return vi.importActual<typeof import('@/features/auth/client')>(
      '@/features/auth/client'
    );
  }

  it('fetchSocialProviders descarta entradas fora do formato', async () => {
    const responses = [
      reply(200, {
        providers: [
          { id: 'google', name: 'Google' },
          { id: '../evil', name: 'X' },
          { id: 'github' },
          null,
        ],
      }),
      reply(200, { providers: 'x' }),
      reply(503),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => responses.shift()!)
    );
    const { fetchSocialProviders } = await actual();
    expect(await fetchSocialProviders()).toEqual([
      { id: 'google', name: 'Google' },
    ]);
    expect(await fetchSocialProviders()).toBeNull();
    expect(await fetchSocialProviders()).toBeNull();
  });

  it('socialLoginHref codifica provedor e destino', async () => {
    const { socialLoginHref } = await actual();
    expect(socialLoginHref('google', '/a?b=1&c=2')).toBe(
      '/auth/oauth/google/start?next=%2Fa%3Fb%3D1%26c%3D2'
    );
  });

  it('fetchPendingSocialSignup lê o contrato', async () => {
    const responses = [
      reply(200, {
        provider: 'github',
        provider_name: 'GitHub',
        email: 'm@x.com',
        suggested_display_name: null,
        suggested_username: 'm',
      }),
      reply(400, { error: { code: 'INVALID_TOKEN' } }),
      reply(200, { qualquer: 1 }),
    ];
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => responses.shift()!)
    );
    const { fetchPendingSocialSignup } = await actual();
    expect(await fetchPendingSocialSignup()).toEqual({
      ok: true,
      pending: {
        provider: 'github',
        providerName: 'GitHub',
        email: 'm@x.com',
        suggestedDisplayName: null,
        suggestedUsername: 'm',
      },
    });
    expect(await fetchPendingSocialSignup()).toEqual({
      ok: false,
      reason: 'none',
    });
    expect(await fetchPendingSocialSignup()).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('completeSocialSignup envia termos e perfil e mapeia as respostas', async () => {
    const responses = [
      reply(201, { user: { id: 'u' }, next_path: '/minha-lista' }),
      reply(400, { error: { code: 'INVALID_TOKEN' } }),
      reply(409, {
        error: { code: 'CONFLICT', details: [{ field: 'username' }] },
      }),
      reply(201, { user: { id: 'u' } }),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal('fetch', fetchMock);
    const { completeSocialSignup } = await actual();
    const input = {
      username: 'm',
      displayName: 'M',
      acceptTerms: true,
      termsVersion: 'v1',
      privacyVersion: 'v2',
      organization: '  Empresa ',
      professionalArea: 'ti' as const,
    };

    expect(await completeSocialSignup(input)).toEqual({
      ok: true,
      user: { id: 'u' },
      nextPath: '/minha-lista',
    });
    expect(await completeSocialSignup(input)).toEqual({
      ok: false,
      reason: 'expired',
    });
    expect(await completeSocialSignup(input)).toEqual({
      ok: false,
      reason: 'username_taken',
    });
    expect(
      (await completeSocialSignup(input)) as { nextPath: string }
    ).toMatchObject({
      nextPath: '/conta',
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('/auth/oauth/complete');
    expect(JSON.parse(String(init.body))).toEqual({
      username: 'm',
      display_name: 'M',
      accept_terms: true,
      terms_version: 'v1',
      privacy_version: 'v2',
      organization: 'Empresa',
      professional_area: 'ti',
    });
  });

  it('cancelSocialSignup não falha sem rede', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('offline');
      })
    );
    const {
      cancelSocialSignup,
      completeSocialSignup,
      fetchPendingSocialSignup,
    } = await actual();
    await expect(cancelSocialSignup()).resolves.toBeUndefined();
    expect(await fetchPendingSocialSignup()).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    expect(
      await completeSocialSignup({
        username: 'm',
        displayName: 'M',
        acceptTerms: true,
        termsVersion: 'v',
        privacyVersion: 'v',
      })
    ).toEqual({ ok: false, reason: 'unavailable' });
  });
});
