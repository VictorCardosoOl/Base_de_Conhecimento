import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const auth = vi.hoisted(() => ({ changePassword: vi.fn() }));
vi.mock('@/features/auth/client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/features/auth/client')>()),
  changePassword: auth.changePassword,
}));

import { ChangePasswordForm } from '@/app/conta/senha/ChangePasswordForm';
import { buildPasswordChangeRedirect, sanitizeNextPath } from '@/features/auth/redirect';

function fill(current: string, next: string, confirm = next) {
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: current } });
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: next } });
  fireEvent.change(screen.getByLabelText('Confirme a nova senha'), { target: { value: confirm } });
  fireEvent.click(screen.getByRole('button', { name: 'Salvar nova senha' }));
}

describe('ChangePasswordForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('troca obrigatória: explica o motivo e, com sucesso, volta ao destino', async () => {
    auth.changePassword.mockResolvedValue({ ok: true });
    render(<ChangePasswordForm required next="/admin/editor?id=pgr" />);
    expect(screen.getByRole('heading').textContent).toBe('Defina uma nova senha');

    fill('temporaria-123', 'minha-senha-nova-longa');
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/admin/editor?id=pgr'));
    expect(auth.changePassword).toHaveBeenCalledWith('temporaria-123', 'minha-senha-nova-longa');
  });

  it.each([
    ['curta', 'curta', 'entre 12 e 256'],
    ['senha-bem-longa-1', 'senha-bem-longa-2', 'A confirmação não confere'],
  ])('validação local antes de enviar (%s)', async (next, confirm, message) => {
    render(<ChangePasswordForm required={false} next="/conta" />);
    fill('atual-qualquer', next, confirm);
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it('nova senha igual à atual é barrada antes de enviar', async () => {
    render(<ChangePasswordForm required={false} next="/conta" />);
    fill('mesma-senha-longa', 'mesma-senha-longa');
    expect((await screen.findByRole('alert')).textContent).toContain('diferente da atual');
    expect(auth.changePassword).not.toHaveBeenCalled();
  });

  it.each([
    [{ ok: false, reason: 'wrong_current' }, 'Senha atual incorreta.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 30 }, 'Tente novamente em 30 s.'],
    // Acima de 60 s, em minutos (arredondado para cima): o limite por conta vai até 15 min.
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 60 }, 'Tente novamente em 60 s.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 61 }, 'Tente novamente em 2 min.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 840 }, 'Tente novamente em 14 min.'],
    [{ ok: false, reason: 'unavailable' }, 'indisponível'],
  ])('erro %j: mensagem própria e campos limpos', async (result, message) => {
    auth.changePassword.mockResolvedValue(result);
    render(<ChangePasswordForm required={false} next="/conta" />);
    fill('atual-errada-x', 'nova-senha-longa-y');
    expect((await screen.findByRole('alert')).textContent).toContain(message);
    for (const label of ['Senha atual', 'Nova senha', 'Confirme a nova senha']) {
      expect((screen.getByLabelText(label) as HTMLInputElement).value).toBe('');
    }
    expect(nav.hardNavigate).not.toHaveBeenCalled();
  });

  it('sessão encerrada: vai ao login e volta para a troca, preservando o destino', async () => {
    auth.changePassword.mockResolvedValue({ ok: false, reason: 'unauthenticated' });
    render(<ChangePasswordForm required next="/admin" />);
    fill('atual-errada-x', 'nova-senha-longa-y');
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith(
        `/login?${new URLSearchParams({ next: '/conta/senha?next=%2Fadmin' })}`
      )
    );
  });
});

describe('changePassword (cliente, via proxy /auth/password)', () => {
  afterEach(() => vi.unstubAllGlobals());
  const realChangePassword = async (current: string, next: string) =>
    (await vi.importActual<typeof import('@/features/auth/client')>('@/features/auth/client')).changePassword(current, next);

  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  it('mapeia o contrato do AuthService', async () => {
    const responses = [
      new Response(null, { status: 204 }),
      json(400, { error: { code: 'VALIDATION_ERROR', message: 'Senha atual incorreta' } }),
      json(400, { error: { code: 'VALIDATION_ERROR', message: 'Dados inválidos', details: [{ field: 'new_password' }] } }),
      json(401, { error: { code: 'UNAUTHORIZED' } }),
      json(429, { error: { code: 'RATE_LIMITED' } }),
      json(503, { error: { code: 'SERVICE_UNAVAILABLE' } }),
    ];
    const fetchMock = vi.fn(async () => responses.shift()!);
    vi.stubGlobal('fetch', fetchMock);

    expect(await realChangePassword('a', 'b')).toEqual({ ok: true });
    expect(await realChangePassword('a', 'b')).toEqual({ ok: false, reason: 'wrong_current' });
    expect(await realChangePassword('a', 'b')).toEqual({ ok: false, reason: 'validation' });
    expect(await realChangePassword('a', 'b')).toEqual({ ok: false, reason: 'unauthenticated' });
    expect(await realChangePassword('a', 'b')).toEqual({ ok: false, reason: 'rate_limited', retryAfterSeconds: null });
    expect(await realChangePassword('a', 'b')).toEqual({ ok: false, reason: 'unavailable' });

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/auth/password');
    expect(init.method).toBe('POST');
    expect(JSON.parse(String(init.body))).toEqual({ current_password: 'a', new_password: 'b' });
  });

  it('não guarda nada no navegador', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 204 })));
    await realChangePassword('atual-senha-x', 'nova-senha-y');
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });
});

describe('redirect da troca de senha', () => {
  it('preserva caminho e query no next', () => {
    expect(buildPasswordChangeRedirect('/admin/usuarios', { pagina: '2' })).toBe(
      '/conta/senha?next=%2Fadmin%2Fusuarios%3Fpagina%3D2'
    );
  });

  it('next não pode apontar para a própria troca (ciclo) nem para fora', () => {
    expect(sanitizeNextPath('/conta/senha', '/conta')).toBe('/conta');
    expect(sanitizeNextPath('/conta/senha?next=%2Fadmin', '/conta')).toBe('/conta');
    expect(sanitizeNextPath('//evil.example', '/conta')).toBe('/conta');
    expect(sanitizeNextPath('/conta', '/')).toBe('/conta');
  });
});
