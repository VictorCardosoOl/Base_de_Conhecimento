import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const nav = vi.hoisted(() => ({ hardNavigate: vi.fn() }));
vi.mock('@/lib/navigation', () => nav);

const auth = vi.hoisted(() => ({ logout: vi.fn(async () => true) }));
vi.mock('@/features/auth/client', () => auth);

import { LogoutButton } from '@/features/auth/components/LogoutButton';

describe('LogoutButton', () => {
  it('revoga a sessão no AuthService e só então volta ao login', async () => {
    const order: string[] = [];
    auth.logout.mockImplementation(async () => {
      order.push('logout');
      return true;
    });
    nav.hardNavigate.mockImplementation(() => {
      order.push('navigate');
    });

    render(<LogoutButton>Sair e entrar com outra conta</LogoutButton>);
    const button = screen.getByRole('button', { name: 'Sair e entrar com outra conta' });
    fireEvent.click(button);

    expect((button as HTMLButtonElement).disabled).toBe(true);
    await waitFor(() => expect(nav.hardNavigate).toHaveBeenCalledWith('/login'));
    expect(order).toEqual(['logout', 'navigate']);
  });

  it('se o AuthService não encerrar a sessão, fica na tela e avisa', async () => {
    nav.hardNavigate.mockReset();
    auth.logout.mockImplementation(async () => false);

    render(<LogoutButton />);
    const button = screen.getByRole('button', { name: 'Sair' });
    fireEvent.click(button);

    expect((await screen.findByRole('alert')).textContent).toContain('Não foi possível encerrar a sessão');
    expect(nav.hardNavigate).not.toHaveBeenCalled();
    expect((button as HTMLButtonElement).disabled).toBe(false);
  });
});
