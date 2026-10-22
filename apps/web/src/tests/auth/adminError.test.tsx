import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import AdminError from '@/app/admin/error';

describe('erro do /admin (AuthService indisponível)', () => {
  it('mostra mensagem própria, o digest e permite tentar de novo', () => {
    const retry = vi.fn();
    const error = Object.assign(new Error('detalhe interno que não deve aparecer'), { digest: 'abc123' });
    render(<AdminError error={error} retry={retry} />);

    expect(screen.getByRole('alert').textContent).toContain('Não foi possível verificar sua sessão');
    expect(document.body.textContent).toContain('abc123');
    expect(document.body.textContent).not.toContain('detalhe interno');
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(retry).toHaveBeenCalledTimes(1);
  });
});
