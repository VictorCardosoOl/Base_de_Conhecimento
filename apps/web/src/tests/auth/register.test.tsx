import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const auth = vi.hoisted(() => ({ register: vi.fn(), fetchSocialProviders: vi.fn() }));
vi.mock('@/features/auth/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/client')>()),
  register: auth.register,
  fetchSocialProviders: auth.fetchSocialProviders,
}));

const identity = vi.hoisted(() => ({ checkUsernameAvailability: vi.fn() }));
vi.mock('@/features/auth/identity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/identity')>()),
  checkUsernameAvailability: identity.checkUsernameAvailability,
}));

import { RegisterForm } from '@/app/cadastro/RegisterForm';
import RegisterPage from '@/app/cadastro/page';
import { sanitizeNextPath } from '@/features/auth/redirect';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/features/legal/documents';

const USER = {
  id: 'u',
  email: 'nova@empresa.com.br',
  username: 'nova.pessoa',
  display_name: 'Nova Pessoa',
  role: 'user',
  must_change_password: false,
};

function fillCredentials(email: string, password: string, confirm = password) {
  fireEvent.change(screen.getByLabelText('Email'), { target: { value: email } });
  fireEvent.change(screen.getByLabelText('Senha'), { target: { value: password } });
  fireEvent.change(screen.getByLabelText('Confirme a senha'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
}

const termsBox = () => screen.getByRole('checkbox', { name: /Li e aceito os Termos de Uso/ });

/** Etapa 2: usuário, nome e (por padrão) o aceite obrigatório dos termos. */
function fillIdentity(username: string, displayName: string, { accept = true } = {}) {
  fireEvent.change(screen.getByLabelText('Usuário'), { target: { value: username } });
  fireEvent.change(screen.getByLabelText('Nome'), { target: { value: displayName } });
  if (accept && !(termsBox() as HTMLInputElement).checked) fireEvent.click(termsBox());
}

const status = () => screen.getByTestId('username-status').textContent ?? '';

describe('RegisterForm (/cadastro)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    identity.checkUsernameAvailability.mockResolvedValue('available');
    auth.fetchSocialProviders.mockResolvedValue([]);
  });

  it('etapa 1 vazia e sem papel; etapa 2 pede usuário e nome; só então cria a conta', async () => {
    auth.register.mockResolvedValue({ ok: true, user: USER });
    render(<RegisterForm next="/conta" />);
    for (const label of ['Email', 'Senha', 'Confirme a senha']) {
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('');
    }
    expect(screen.queryByRole('combobox')).toBeNull(); // não existe escolha de papel
    expect(screen.queryByLabelText('Usuário')).toBeNull();

    fillCredentials('  nova@empresa.com.br ', 'uma-senha-bem-longa');
    expect(screen.getByRole('heading', { name: 'Como você quer ser chamado?' })).toBeTruthy();
    expect(screen.getByText('Etapa 2 de 2')).toBeTruthy();
    expect(document.activeElement).toBe(screen.getByLabelText('Usuário'));
    expect(auth.register).not.toHaveBeenCalled();

    fillIdentity('  Nova.Pessoa ', '  Nova Pessoa ');
    await waitFor(() => expect(status()).toBe('Disponível.'));
    expect(identity.checkUsernameAvailability).toHaveBeenLastCalledWith(
      'nova.pessoa',
      expect.any(AbortSignal)
    );
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/conta'));
    expect(auth.register).toHaveBeenCalledWith({
      email: 'nova@empresa.com.br',
      password: 'uma-senha-bem-longa',
      username: 'nova.pessoa',
      displayName: 'Nova Pessoa',
      acceptTerms: true,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      organization: '',
      professionalArea: '',
    });
  }, 15_000);

  it('sem o aceite dos termos não cria a conta e aponta o checkbox', async () => {
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', 'Alguém', { accept: false });
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));

    expect((await screen.findByRole('alert')).textContent).toContain('Corrija os campos');
    expect(termsBox().getAttribute('aria-invalid')).toBe('true');
    expect(screen.getByText(/aceite os Termos de Uso e a Política de Privacidade/)).toBeTruthy();
    expect(document.activeElement).toBe(termsBox());
    expect(auth.register).not.toHaveBeenCalled();

    fireEvent.click(termsBox());
    expect(termsBox().getAttribute('aria-invalid')).toBeNull();
  });

  it('termos abrem em nova aba, sem perder o formulário', () => {
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    for (const [name, href] of [
      [/Termos de Uso/, '/termos'],
      [/Política de Privacidade/, '/privacidade'],
    ] as const) {
      const link = screen.getByRole('link', { name });
      expect(link.getAttribute('href')).toBe(href);
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toContain('noopener');
      expect(link.textContent).toContain('(abre em nova aba)');
    }
  });

  it('perfil opcional (organização e área) vai junto quando preenchido', async () => {
    auth.register.mockResolvedValue({ ok: true, user: USER });
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    expect(screen.getByRole('group', { name: 'Perfil (opcional)' })).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Organização'), { target: { value: 'Clínica X' } });
    fireEvent.change(screen.getByLabelText('Área de atuação'), {
      target: { value: 'saude_ocupacional' },
    });
    fillIdentity('alguem', 'Alguém');
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(auth.register).toHaveBeenCalled());
    expect(auth.register.mock.calls[0][0]).toMatchObject({
      organization: 'Clínica X',
      professionalArea: 'saude_ocupacional',
    });
  });

  it('nome reservado: avisa na hora, sem consultar o servidor, e não envia', async () => {
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('Su.Por-te', 'Alguém');
    expect(status()).toBe('Este nome é reservado. Escolha outro.');
    expect(screen.getByLabelText('Usuário').getAttribute('aria-invalid')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Corrija os campos');
    expect(identity.checkUsernameAvailability).not.toHaveBeenCalled();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('nome recusado como reservado pelo servidor: marca o campo', async () => {
    auth.register.mockResolvedValue({ ok: false, reason: 'username_reserved' });
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', 'Alguém');
    await waitFor(() => expect(status()).toBe('Disponível.'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(status()).toBe('Este nome é reservado. Escolha outro.'));
  });

  it('mostra os botões sociais só na etapa 1, com divisor', async () => {
    auth.fetchSocialProviders.mockResolvedValue([{ id: 'google', name: 'Google' }]);
    render(<RegisterForm next="/conta" />);
    const google = await screen.findByRole('link', { name: 'Cadastrar com Google' });
    expect(google.getAttribute('href')).toBe('/auth/oauth/google/start?next=%2Fconta');
    expect(screen.getByRole('separator', { name: 'ou cadastre-se com email' })).toBeTruthy();
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    expect(screen.queryByRole('link', { name: 'Cadastrar com Google' })).toBeNull();
  });

  it.each([
    ['sem-arroba', 'uma-senha-bem-longa', 'uma-senha-bem-longa', 'email válido'],
    ['a@empresa.com.br', 'curta', 'curta', 'entre 12 e 256'],
    ['a@empresa.com.br', 'senha-bem-longa-1', 'senha-bem-longa-2', 'A confirmação não confere'],
  ])('etapa 1 valida antes de avançar (%s / %s)', async (email, password, confirm, message) => {
    render(<RegisterForm next="/conta" />);
    fillCredentials(email, password, confirm);
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(screen.queryByLabelText('Usuário')).toBeNull();
  });

  it('usuário fora do formato ou ocupado: avisa e não envia', async () => {
    identity.checkUsernameAvailability.mockResolvedValue('taken');
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');

    fillIdentity('ab', 'Alguém');
    expect(status()).toContain('De 3 a 30 caracteres');
    expect(screen.getByLabelText('Usuário').getAttribute('aria-invalid')).toBe('true');
    expect(identity.checkUsernameAvailability).not.toHaveBeenCalled();

    fillIdentity('ocupado', 'Alguém');
    await waitFor(() => expect(status()).toContain('já está em uso'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Corrija os campos');
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('nome em branco não envia', async () => {
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', '   ');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect(await screen.findByText('Informe como você quer ser chamado.')).toBeTruthy();
    expect(auth.register).not.toHaveBeenCalled();
  });

  it('usuário ocupado no envio (corrida): marca o campo e continua na etapa 2', async () => {
    auth.register.mockResolvedValue({ ok: false, reason: 'username_taken' });
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', 'Alguém');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    await waitFor(() => expect(status()).toContain('já está em uso'));
    expect(screen.getByLabelText('Usuário')).toBeTruthy();
    expect(nav.hardNavigate).not.toHaveBeenCalled();
  });

  it('email já cadastrado: volta para a etapa 1 com as senhas limpas', async () => {
    auth.register.mockResolvedValue({ ok: false, reason: 'email_taken' });
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', 'Alguém');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Já existe uma conta com este email');
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('a@empresa.com.br');
    expect((screen.getByLabelText('Senha') as HTMLInputElement).value).toBe('');
    expect((screen.getByLabelText('Confirme a senha') as HTMLInputElement).value).toBe('');
  });

  it.each([
    [{ ok: false, reason: 'disabled' }, 'O cadastro está desativado'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 60 }, 'Tente novamente em 60 s.'],
    // Acima de 60 s, em minutos (o limite de cadastro por IP é de 10 min).
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 61 }, 'Muitos cadastros em sequência. Tente novamente em 2 min.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 540 }, 'Tente novamente em 9 min.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: null }, 'Tente novamente em instantes.'],
    [{ ok: false, reason: 'unavailable' }, 'indisponível'],
    [{ ok: false, reason: 'validation' }, 'Verifique os dados'],
    [{ ok: false, reason: 'terms_outdated' }, 'foram atualizados'],
  ])('erro %j: mensagem própria', async (result, message) => {
    auth.register.mockResolvedValue(result);
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', 'Alguém');
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta' }));
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(nav.hardNavigate).not.toHaveBeenCalled();
  });

  it('"Voltar" preserva o que foi digitado', () => {
    render(<RegisterForm next="/conta" />);
    fillCredentials('a@empresa.com.br', 'uma-senha-bem-longa');
    fillIdentity('alguem', 'Alguém');
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }));
    expect((screen.getByLabelText('Email') as HTMLInputElement).value).toBe('a@empresa.com.br');
    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    expect((screen.getByLabelText('Usuário') as HTMLInputElement).value).toBe('alguem');
  });

  it('leva ao login preservando o destino', () => {
    render(<RegisterForm next="/admin" />);
    expect(screen.getByRole('link', { name: 'Entrar' }).getAttribute('href')).toBe('/login?next=%2Fadmin');
  });

  it('a página valida o next no servidor (padrão: /conta)', async () => {
    const evil = (await RegisterPage({ searchParams: Promise.resolve({ next: 'https://evil.example' }) })) as ReactElement<{
      next: string;
    }>;
    const safe = (await RegisterPage({ searchParams: Promise.resolve({ next: '/admin' }) })) as ReactElement<{
      next: string;
    }>;
    expect(evil.props.next).toBe('/conta');
    expect(safe.props.next).toBe('/admin');
    expect(sanitizeNextPath('/cadastro', '/conta')).toBe('/conta');
  });
});

describe('register (cliente, via proxy /auth/register)', () => {
  afterEach(() => vi.unstubAllGlobals());

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const conflict = (field?: string) =>
    json(409, {
      error: { code: 'CONFLICT', message: 'x', ...(field ? { details: [{ field, message: 'x' }] } : {}) },
    });
  const input = {
    email: 'a@b.com.br',
    password: 'senha',
    username: 'alguem',
    displayName: 'Alguém',
    acceptTerms: true,
    termsVersion: '2026-10-10',
    privacyVersion: '2026-10-10',
  };
  const fieldError = (field: string) =>
    json(400, { error: { code: 'VALIDATION_ERROR', message: 'x', details: [{ field, message: 'x' }] } });

  it('envia email, senha, usuário e nome (nunca papel) e mapeia o contrato', async () => {
    const responses = [
      json(201, { user: USER, access_token_expires_at: 'x' }),
      conflict('email'),
      conflict('username'),
      conflict(),
      json(400, { error: { code: 'VALIDATION_ERROR' } }),
      fieldError('username'),
      fieldError('terms_version'),
      fieldError('privacy_version'),
      json(404, { error: { code: 'NOT_FOUND' } }),
      json(429, { error: { code: 'RATE_LIMITED' } }),
      json(503, { error: { code: 'SERVICE_UNAVAILABLE' } }),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal('fetch', fetchMock);
    const { register } = await vi.importActual<typeof import('@/features/auth/client')>('@/features/auth/client');

    expect(await register(input)).toEqual({ ok: true, user: USER });
    expect(await register(input)).toEqual({ ok: false, reason: 'email_taken' });
    expect(await register(input)).toEqual({ ok: false, reason: 'username_taken' });
    expect(await register(input)).toEqual({ ok: false, reason: 'email_taken' });
    expect(await register(input)).toEqual({ ok: false, reason: 'validation' });
    expect(await register(input)).toEqual({ ok: false, reason: 'username_reserved' });
    expect(await register(input)).toEqual({ ok: false, reason: 'terms_outdated' });
    expect(await register(input)).toEqual({ ok: false, reason: 'terms_outdated' });
    expect(await register(input)).toEqual({ ok: false, reason: 'disabled' });
    expect(await register(input)).toEqual({ ok: false, reason: 'rate_limited', retryAfterSeconds: null });
    expect(await register(input)).toEqual({ ok: false, reason: 'unavailable' });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/auth/register');
    expect(JSON.parse(String(init.body))).toEqual({
      email: 'a@b.com.br',
      password: 'senha',
      username: 'alguem',
      display_name: 'Alguém',
      accept_terms: true,
      terms_version: '2026-10-10',
      privacy_version: '2026-10-10',
      organization: null,
      professional_area: null,
    });
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it('rede fora do ar: indisponível', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    const { register } = await vi.importActual<typeof import('@/features/auth/client')>('@/features/auth/client');
    expect(await register(input)).toEqual({ ok: false, reason: 'unavailable' });
  });
});
