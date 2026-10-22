import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactElement } from 'react';
import { sanitizeNextPath } from '@/features/auth/redirect';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const auth = vi.hoisted(() => ({
  refreshSession: vi.fn<() => Promise<boolean>>(),
  login: vi.fn(),
  fetchSocialProviders: vi.fn(async () => [] as Array<{ id: string; name: string }>),
  socialLoginHref: (id: string, next: string) =>
    `/auth/oauth/${id}/start?${new URLSearchParams({ next })}`,
}));
vi.mock('@/features/auth/client', () => auth);

import { LoginForm } from '@/app/login/LoginForm';
import LoginPage from '@/app/login/page';

async function renderForm(next = '/admin') {
  render(<LoginForm next={next} />);
  await screen.findByLabelText('Email');
}

describe('sanitizeNextPath', () => {
  it.each([
    ['/admin', '/admin'],
    ['/admin/editor?id=pgr#x', '/admin/editor?id=pgr#x'],
    ['/artigo/pgr', '/artigo/pgr'],
  ])('aceita caminho interno %s', (input, expected) => {
    expect(sanitizeNextPath(input)).toBe(expected);
  });

  it.each([
    'https://evil.example/admin',
    '//evil.example',
    '/\\evil.example',
    'javascript:alert(1)',
    '/admin\n',
    'admin',
    '',
    undefined,
    ['/admin'],
    '/login',
    '/login?next=%2Fadmin',
  ])('rejeita %j e usa o fallback', (input) => {
    expect(sanitizeNextPath(input)).toBe('/');
  });
});

describe('LoginPage', () => {
  it('valida o next no servidor antes de entregar ao formulário', async () => {
    const safe = (await LoginPage({
      searchParams: Promise.resolve({ next: '/admin/editor?id=pgr' }),
    })) as ReactElement<{ next: string }>;
    const evil = (await LoginPage({
      searchParams: Promise.resolve({ next: 'https://evil.example' }),
    })) as ReactElement<{ next: string }>;
    expect(safe.props.next).toBe('/admin/editor?id=pgr');
    expect(evil.props.next).toBe('/');
  });
});

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    auth.refreshSession.mockResolvedValue(false);
  });

  it('renova a sessão em silêncio e volta ao next sem pedir senha', async () => {
    auth.refreshSession.mockResolvedValue(true);
    render(<LoginForm next="/admin/editor" />);
    expect(screen.getByRole('status').textContent).toContain('Verificando sessão');
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/admin/editor'));
    expect(screen.queryByLabelText('Senha')).toBeNull();
  });

  it('sem sessão para renovar, mostra o formulário (sem credenciais de demonstração)', async () => {
    await renderForm();
    // Campos vazios e sem texto de exemplo que pareça dado preenchido.
    for (const label of ['Email', 'Senha']) {
      const input = screen.getByLabelText(label) as HTMLInputElement;
      expect(input.value).toBe('');
      expect(input.getAttribute('placeholder')).toBeNull();
    }
    // Cadastro a um clique, preservando o destino.
    expect(screen.getByRole('link', { name: 'Criar conta' }).getAttribute('href')).toBe('/cadastro?next=%2Fadmin');
    expect(auth.refreshSession).toHaveBeenCalledTimes(1);
    expect(screen.queryByLabelText('Senha')).not.toBeNull();
    expect(document.body.textContent).not.toMatch(/admin@admin|demonstra/i);
    expect(nav.hardNavigate).not.toHaveBeenCalled();
  });

  it('login com sucesso redireciona para o next', async () => {
    auth.login.mockResolvedValue({
      ok: true,
      user: { id: 'u', email: 'a@b.c', role: 'admin', must_change_password: false },
    });
    await renderForm('/admin');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: '  admin@teste.local ' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha-correta' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect(auth.login).toHaveBeenCalledWith('admin@teste.local', 'senha-correta');
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/admin'));
  });

  it('senha definida pelo admin: login leva à troca de senha, preservando o destino', async () => {
    auth.login.mockResolvedValue({
      ok: true,
      user: { id: 'u', email: 'a@b.c', role: 'editor', must_change_password: true },
    });
    await renderForm('/admin/editor');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'temporaria-123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() =>
      expect(nav.hardNavigate).toHaveBeenCalledWith('/conta/senha?next=%2Fadmin%2Feditor')
    );
  });

  it.each([
    [{ ok: false, reason: 'invalid_credentials' }, 'Email ou senha inválidos.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 30 }, 'Tente novamente em 30 s.'],
    // Acima de 60 s, em minutos (arredondado para cima): o limite por conta vai até 15 min.
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 60 }, 'Tente novamente em 60 s.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 61 }, 'Tente novamente em 2 min.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: 840 }, 'Tente novamente em 14 min.'],
    [{ ok: false, reason: 'rate_limited', retryAfterSeconds: null }, 'Tente novamente em instantes.'],
    [{ ok: false, reason: 'validation' }, 'Verifique o email e a senha informados.'],
    [{ ok: false, reason: 'unavailable' }, 'Serviço de autenticação indisponível.'],
  ])('erro %j mostra mensagem própria e limpa a senha', async (result, message) => {
    auth.login.mockResolvedValue(result);
    await renderForm();
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'errada' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));

    expect((await screen.findByRole('alert')).textContent).toContain(message);
    expect((screen.getByLabelText('Senha') as HTMLInputElement).value).toBe('');
    expect(nav.hardNavigate).not.toHaveBeenCalled();
  });

  it('interrompe o loop quando o destino devolve ao login logo após renovar', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.refreshSession.mockResolvedValue(true);

    // 1ª visita: renova e volta ao destino.
    const first = render(<LoginForm next="/admin" />);
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledTimes(1));
    first.unmount();

    // O destino não reconheceu a sessão e devolveu ao login: não navegar de novo.
    render(<LoginForm next="/admin" />);
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível manter a sessão');
    expect(screen.queryByLabelText('Senha')).not.toBeNull();
    expect(nav.hardNavigate).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(String(consoleError.mock.calls[0][0])).not.toMatch(/eyJ|kb_rt=/);
    consoleError.mockRestore();
  });

  it('destino diferente não é tratado como loop', async () => {
    auth.refreshSession.mockResolvedValue(true);
    const first = render(<LoginForm next="/admin" />);
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/admin'));
    first.unmount();

    render(<LoginForm next="/admin/editor" />);
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/admin/editor'));
  });

  it('login com senha também é protegido contra o loop', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    auth.login.mockResolvedValue({
      ok: true,
      user: { id: 'u', email: 'a@b.c', role: 'admin', must_change_password: false },
    });
    const first = render(<LoginForm next="/admin" />);
    await screen.findByLabelText('Email');
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.c' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledTimes(1));
    first.unmount();

    auth.refreshSession.mockResolvedValue(true);
    render(<LoginForm next="/admin" />);
    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível manter a sessão');
    expect(nav.hardNavigate).toHaveBeenCalledTimes(1);
    consoleError.mockRestore();
  });
});
