import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const auth = vi.hoisted(() => ({
  requestPasswordReset: vi.fn(),
  resetPassword: vi.fn(),
  verifyEmail: vi.fn(),
  resendEmailVerification: vi.fn(),
}));
vi.mock('@/features/auth/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/client')>()),
  ...auth,
}));

import { ForgotPasswordForm } from '@/app/esqueci-senha/ForgotPasswordForm';
import ForgotPasswordPage from '@/app/esqueci-senha/page';
import { ResetPasswordForm } from '@/app/redefinir-senha/ResetPasswordForm';
import { VerifyEmail } from '@/app/verificar-email/VerifyEmail';
import { EmailVerificationStatus } from '@/app/conta/EmailVerificationStatus';
import { takeTokenFromHash } from '@/features/auth/components/AuthFormParts';

const TOKEN = 'a'.repeat(43);

function setHash(hash: string) {
  window.history.replaceState(null, '', `/redefinir-senha${hash}`);
}

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(null, '', '/');
});

describe('takeTokenFromHash', () => {
  it('lê o token do fragmento e apaga o fragmento da barra de endereço', () => {
    setHash(`#token=${TOKEN}`);
    expect(takeTokenFromHash()).toBe(TOKEN);
    expect(window.location.hash).toBe('');
    expect(window.location.pathname).toBe('/redefinir-senha');
  });

  it.each([
    '',
    '#token=',
    '#token=curto',
    '#token=com espaço-aaaaaaaaaaaaaaaaaaaaaa',
    '#outro=x',
  ])('fragmento %j: sem token válido', (hash) => {
    setHash(hash);
    expect(takeTokenFromHash()).toBeNull();
  });
});

describe('ForgotPasswordForm (/esqueci-senha)', () => {
  const submit = (email: string) => {
    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: email },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar link' }));
  };

  it('resposta neutra: a mesma mensagem, exista ou não a conta', async () => {
    auth.requestPasswordReset.mockResolvedValue({ ok: true });
    render(<ForgotPasswordForm next="/admin" />);
    submit('  pessoa@empresa.com.br ');

    const notice = await screen.findByRole('status');
    expect(notice.textContent).toContain('Se houver uma conta com este email');
    expect(notice.textContent).toContain('30 minutos');
    expect(auth.requestPasswordReset).toHaveBeenCalledWith(
      'pessoa@empresa.com.br'
    );
    expect(
      screen
        .getByRole('link', { name: 'Voltar para o login' })
        .getAttribute('href')
    ).toBe('/login?next=%2Fadmin');

    fireEvent.click(
      screen.getByRole('button', { name: 'Não recebeu? Pedir de novo' })
    );
    expect(screen.getByRole('button', { name: 'Enviar link' })).toBeTruthy();
  });

  it('email inválido não envia', async () => {
    render(<ForgotPasswordForm next="/" />);
    submit('sem-arroba');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'email válido'
    );
    expect(auth.requestPasswordReset).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(screen.getByLabelText('Email'));
  });

  it.each([
    [
      { ok: false, reason: 'rate_limited', retryAfterSeconds: 600 },
      'em 10 min',
    ],
    [
      { ok: false, reason: 'rate_limited', retryAfterSeconds: null },
      'alguns minutos',
    ],
    [{ ok: false, reason: 'unavailable' }, 'indisponível'],
    [{ ok: false, reason: 'validation' }, 'email válido'],
  ])('falha %j: mensagem própria', async (result, message) => {
    auth.requestPasswordReset.mockResolvedValue(result);
    render(<ForgotPasswordForm next="/" />);
    submit('pessoa@empresa.com.br');
    expect((await screen.findByRole('alert')).textContent).toContain(message);
  });

  it('a página valida o next', async () => {
    const page = (await ForgotPasswordPage({
      searchParams: Promise.resolve({ next: 'https://evil.example' }),
    })) as ReactElement<{ next: string }>;
    expect(page.props.next).toBe('/');
  });
});

describe('ResetPasswordForm (/redefinir-senha)', () => {
  const fill = (password: string, confirm = password) => {
    fireEvent.change(screen.getByLabelText('Nova senha'), {
      target: { value: password },
    });
    fireEvent.change(screen.getByLabelText('Confirme a nova senha'), {
      target: { value: confirm },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
  };

  it('sem token no link: orienta a pedir um novo', async () => {
    render(<ResetPasswordForm />);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'link enviado ao seu email'
    );
    expect(
      screen
        .getByRole('link', { name: 'Pedir um novo link' })
        .getAttribute('href')
    ).toBe('/esqueci-senha');
  });

  it('valida a senha como no cadastro e, com sucesso, vai ao login com aviso', async () => {
    auth.resetPassword.mockResolvedValue({ ok: true });
    setHash(`#token=${TOKEN}`);
    render(<ResetPasswordForm />);
    await screen.findByLabelText('Nova senha');
    expect(window.location.hash).toBe(''); // o token sai da barra de endereço

    fill('curta');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'entre 12 e 256'
    );
    fill('uma-senha-bem-longa', 'outra-senha-longa');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'não confere'
    );
    expect(auth.resetPassword).not.toHaveBeenCalled();

    fill('uma-senha-bem-longa');
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith(
        '/login?aviso=senha-redefinida'
      )
    );
    expect(auth.resetPassword).toHaveBeenCalledWith(
      TOKEN,
      'uma-senha-bem-longa'
    );
  });

  it('link usado ou vencido: troca o formulário pelo pedido de novo link', async () => {
    auth.resetPassword.mockResolvedValue({
      ok: false,
      reason: 'invalid_token',
    });
    setHash(`#token=${TOKEN}`);
    render(<ResetPasswordForm />);
    await screen.findByLabelText('Nova senha');
    fill('uma-senha-bem-longa');
    expect((await screen.findByRole('alert')).textContent).toContain(
      'já foi usado ou expirou'
    );
    expect(screen.queryByLabelText('Nova senha')).toBeNull();
  });

  it.each([
    [
      { ok: false, reason: 'rate_limited', retryAfterSeconds: 60 },
      'Muitas tentativas',
    ],
    [{ ok: false, reason: 'unavailable' }, 'indisponível'],
    [{ ok: false, reason: 'validation' }, 'entre 12 e 256'],
  ])('falha %j: mensagem e continua no formulário', async (result, message) => {
    auth.resetPassword.mockResolvedValue(result);
    setHash(`#token=${TOKEN}`);
    render(<ResetPasswordForm />);
    await screen.findByLabelText('Nova senha');
    fill('uma-senha-bem-longa');
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(screen.getByLabelText('Nova senha')).toBeTruthy();
  });
});

describe('VerifyEmail (/verificar-email)', () => {
  it('confirma sozinho ao abrir', async () => {
    auth.verifyEmail.mockResolvedValue({ ok: true });
    window.history.replaceState(null, '', `/verificar-email#token=${TOKEN}`);
    render(<VerifyEmail />);
    expect(
      (await screen.findByText('Email confirmado. Obrigado!')).closest(
        '[role="status"]'
      )
    ).toBeTruthy();
    expect(auth.verifyEmail).toHaveBeenCalledTimes(1);
    expect(auth.verifyEmail).toHaveBeenCalledWith(TOKEN);
  });

  it('sem token: não chama o servidor', async () => {
    render(<VerifyEmail />);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'link enviado ao seu email'
    );
    expect(auth.verifyEmail).not.toHaveBeenCalled();
  });

  it('link inválido', async () => {
    auth.verifyEmail.mockResolvedValue({ ok: false, reason: 'invalid_token' });
    window.history.replaceState(null, '', `/verificar-email#token=${TOKEN}`);
    render(<VerifyEmail />);
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Peça um novo em Minha conta'
    );
  });

  it('serviço fora do ar: permite tentar de novo', async () => {
    auth.verifyEmail
      .mockResolvedValueOnce({ ok: false, reason: 'unavailable' })
      .mockResolvedValueOnce({ ok: true });
    window.history.replaceState(null, '', `/verificar-email#token=${TOKEN}`);
    render(<VerifyEmail />);
    fireEvent.click(
      await screen.findByRole('button', { name: 'Tentar de novo' })
    );
    expect(await screen.findByText('Email confirmado. Obrigado!')).toBeTruthy();
    expect(auth.verifyEmail).toHaveBeenCalledTimes(2);
  });
});

describe('EmailVerificationStatus (Minha conta)', () => {
  it('confirmado: só informa', () => {
    render(<EmailVerificationStatus verified />);
    expect(screen.getByText('Email confirmado.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('não confirmado: reenvia o link', async () => {
    auth.resendEmailVerification.mockResolvedValue({ ok: true });
    render(<EmailVerificationStatus verified={false} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Reenviar link de confirmação' })
    );
    expect((await screen.findByRole('status')).textContent).toContain(
      'Enviamos um novo link'
    );
  });

  it('limite de reenvios e sessão encerrada', async () => {
    auth.resendEmailVerification.mockResolvedValueOnce({
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: 60,
    });
    render(<EmailVerificationStatus verified={false} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Reenviar link de confirmação' })
    );
    expect((await screen.findByRole('alert')).textContent).toContain(
      'Muitos reenvios'
    );

    auth.resendEmailVerification.mockResolvedValueOnce({
      ok: false,
      reason: 'unauthenticated',
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Reenviar link de confirmação' })
    );
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith('/login?next=%2Fconta')
    );
  });
});

describe('cliente: recuperação e confirmação', () => {
  afterEach(() => vi.unstubAllGlobals());

  const reply = (
    status: number,
    body?: unknown,
    headers: Record<string, string> = {}
  ) =>
    new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json', ...headers },
    });

  async function actual() {
    return vi.importActual<typeof import('@/features/auth/client')>(
      '@/features/auth/client'
    );
  }

  it('requestPasswordReset mapeia o contrato e nunca revela a conta', async () => {
    const responses = [
      reply(202, { message: 'x' }),
      reply(400, { error: { code: 'VALIDATION_ERROR' } }),
      reply(429, { error: { code: 'RATE_LIMITED' } }, { 'Retry-After': '900' }),
      reply(503),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal('fetch', fetchMock);
    const { requestPasswordReset } = await actual();

    expect(await requestPasswordReset('a@b.com')).toEqual({ ok: true });
    expect(await requestPasswordReset('a@b.com')).toEqual({
      ok: false,
      reason: 'validation',
    });
    expect(await requestPasswordReset('a@b.com')).toEqual({
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: 900,
    });
    expect(await requestPasswordReset('a@b.com')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('/auth/password/forgot');
    expect(JSON.parse(String(init.body))).toEqual({ email: 'a@b.com' });
  });

  it('resetPassword e verifyEmail distinguem link inválido de senha fora da regra', async () => {
    const responses = [
      reply(204),
      reply(400, { error: { code: 'INVALID_TOKEN' } }),
      reply(400, {
        error: {
          code: 'VALIDATION_ERROR',
          details: [{ field: 'new_password' }],
        },
      }),
      reply(429, { error: { code: 'RATE_LIMITED' } }),
      reply(204),
      reply(400, { error: { code: 'INVALID_TOKEN' } }),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal('fetch', fetchMock);
    const { resetPassword, verifyEmail } = await actual();

    expect(await resetPassword(TOKEN, 'senha')).toEqual({ ok: true });
    expect(await resetPassword(TOKEN, 'senha')).toEqual({
      ok: false,
      reason: 'invalid_token',
    });
    expect(await resetPassword(TOKEN, 'senha')).toEqual({
      ok: false,
      reason: 'validation',
    });
    expect(await resetPassword(TOKEN, 'senha')).toEqual({
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: null,
    });
    expect(await verifyEmail(TOKEN)).toEqual({ ok: true });
    expect(await verifyEmail(TOKEN)).toEqual({
      ok: false,
      reason: 'invalid_token',
    });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      string,
      RequestInit,
    ];
    expect(url).toBe('/auth/password/reset');
    expect(JSON.parse(String(init.body))).toEqual({
      token: TOKEN,
      new_password: 'senha',
    });
    expect((fetchMock.mock.calls[4] as unknown as [string])[0]).toBe(
      '/auth/email/verify'
    );
  });

  it('rede fora do ar: indisponível', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('fetch failed');
      })
    );
    const {
      requestPasswordReset,
      resetPassword,
      verifyEmail,
      resendEmailVerification,
    } = await actual();
    expect(await requestPasswordReset('a@b.com')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    expect(await resetPassword(TOKEN, 's')).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    expect(await verifyEmail(TOKEN)).toEqual({
      ok: false,
      reason: 'unavailable',
    });
    expect(await resendEmailVerification()).toEqual({
      ok: false,
      reason: 'unavailable',
    });
  });

  it('resendEmailVerification renova a sessão expirada uma vez', async () => {
    const responses = [
      reply(401, { error: { code: 'SESSION_EXPIRED' } }),
      reply(200, { user: {} }),
      reply(202, { message: 'ok' }),
      reply(429, { error: { code: 'RATE_LIMITED' } }),
      reply(401, { error: { code: 'UNAUTHORIZED' } }),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal('fetch', fetchMock);
    const { resendEmailVerification } = await actual();

    expect(await resendEmailVerification()).toEqual({ ok: true });
    expect((fetchMock.mock.calls[1] as unknown as [string])[0]).toBe(
      '/auth/refresh'
    );
    expect(await resendEmailVerification()).toEqual({
      ok: false,
      reason: 'rate_limited',
      retryAfterSeconds: null,
    });
    expect(await resendEmailVerification()).toEqual({
      ok: false,
      reason: 'unauthenticated',
    });
  });
});
