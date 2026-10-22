import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import {
  checkUsernameAvailability,
  displayNameProblem,
  isValidUsername,
  normalizeUsername,
} from '@/features/auth/identity';
import { useUsernameAvailability } from '@/features/auth/use-username-availability';

describe('regras de usuário e nome (iguais às do AuthService)', () => {
  it.each([
    'abc',
    'maria.silva',
    'joao_2',
    'a-b',
    '9nove',
    'x'.repeat(30),
    '  Maria.Silva  ',
  ])('aceita %j', (value) => expect(isValidUsername(value)).toBe(true));

  it.each([
    '',
    'ab',
    'x'.repeat(31),
    '-maria',
    '.maria',
    '_maria',
    'maria silva',
    'joão',
    'a@b',
  ])('recusa %j', (value) => expect(isValidUsername(value)).toBe(false));

  it('normaliza para minúsculas sem espaços nas pontas', () => {
    expect(normalizeUsername('  Maria.SILVA ')).toBe('maria.silva');
  });

  it('nome: livre, obrigatório e com até 100 caracteres', () => {
    expect(displayNameProblem('Zé d’Ávila 🚀')).toBeNull();
    expect(displayNameProblem('   ')).toContain('Informe');
    expect(displayNameProblem('x'.repeat(100))).toBeNull();
    expect(displayNameProblem('x'.repeat(101))).toContain('até 100');
  });
});

describe('checkUsernameAvailability (GET /auth/username-available)', () => {
  const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status });

  it('consulta só valores válidos, já normalizados, e interpreta o contrato', async () => {
    const fetchImpl = vi.fn(async () =>
      json(200, { available: true, reason: null })
    );
    expect(
      await checkUsernameAvailability(
        ' Maria.Silva ',
        undefined,
        fetchImpl as never
      )
    ).toBe('available');
    expect((fetchImpl.mock.calls[0] as unknown as [string])[0]).toBe(
      '/auth/username-available?username=maria.silva'
    );

    expect(
      await checkUsernameAvailability('ab', undefined, fetchImpl as never)
    ).toBe('invalid');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it.each([
    [json(200, { available: false, reason: 'taken' }), 'taken'],
    [json(200, { available: false, reason: 'invalid' }), 'invalid'],
    [json(200, { available: false, reason: 'reserved' }), 'reserved'],
    [json(200, { available: false, reason: 'outro' }), 'error'],
    [json(429, { error: { code: 'RATE_LIMITED' } }), 'rate_limited'],
    [json(503, {}), 'error'],
    [new Response('não é json', { status: 200 }), 'error'],
  ])('resposta %# → %s', async (response, expected) => {
    const fetchImpl = vi.fn(async () => response);
    expect(
      await checkUsernameAvailability('maria', undefined, fetchImpl as never)
    ).toBe(expected);
  });

  it('cancelada: propaga o cancelamento (o hook descarta)', async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchImpl = vi.fn(async () => {
      throw new DOMException('aborted', 'AbortError');
    });
    await expect(
      checkUsernameAvailability('maria', controller.signal, fetchImpl as never)
    ).rejects.toThrow('aborted');
  });
});

describe('useUsernameAvailability', () => {
  afterEach(() => vi.useRealTimers());

  it('formato na hora; consulta depois da pausa; resposta antiga não vale', async () => {
    const check = vi.fn(async (value: string) =>
      value === 'ocupado' ? 'taken' : 'available'
    );
    const { result, rerender } = renderHook(
      ({ value }) => useUsernameAvailability(value, check as never),
      { initialProps: { value: '' } }
    );
    expect(result.current).toBe('idle');

    rerender({ value: 'ab' });
    expect(result.current).toBe('invalid');

    rerender({ value: 'Ocupado' });
    expect(result.current).toBe('checking');
    await waitFor(() => expect(result.current).toBe('taken'));
    expect(check).toHaveBeenLastCalledWith('ocupado', expect.any(AbortSignal));

    rerender({ value: 'livre' });
    expect(result.current).toBe('checking'); // o "taken" era de outro valor
    await waitFor(() => expect(result.current).toBe('available'));
  });

  it('nome reservado: avisa na hora, sem consultar o AuthService', () => {
    const check = vi.fn(async () => 'available' as const);
    const { result } = renderHook(() => useUsernameAvailability('Su.Por-te', check as never));
    expect(result.current).toBe('reserved');
    expect(check).not.toHaveBeenCalled();
  });

  it('digitação rápida: só o último valor é consultado', async () => {
    vi.useFakeTimers();
    const check = vi.fn(async () => 'available' as const);
    const { rerender } = renderHook(
      ({ value }) => useUsernameAvailability(value, check),
      {
        initialProps: { value: 'mar' },
      }
    );
    rerender({ value: 'mari' });
    rerender({ value: 'maria' });
    await vi.advanceTimersByTimeAsync(500);
    expect(check).toHaveBeenCalledTimes(1);
    expect(check).toHaveBeenCalledWith('maria', expect.any(AbortSignal));
  });
});
