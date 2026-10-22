'use client';
import { useEffect, useState } from 'react';
import {
  checkUsernameAvailability,
  isReservedUsername,
  isValidUsername,
  normalizeUsername,
  type UsernameAvailability,
} from './identity';

export type UsernameStatus = 'idle' | 'checking' | UsernameAvailability;

const DEBOUNCE_MS = 400;

/**
 * Disponibilidade do usuário enquanto a pessoa digita: formato e nomes reservados checados
 * na hora, consulta ao AuthService só depois de uma pausa (e a anterior é cancelada).
 */
export function useUsernameAvailability(
  username: string,
  check: typeof checkUsernameAvailability = checkUsernameAvailability
): UsernameStatus {
  const normalized = normalizeUsername(username);
  const reserved = isReservedUsername(normalized);
  // Reservado já se sabe aqui: nem consulta o AuthService.
  const valid = isValidUsername(normalized) && !reserved;
  // Resultado guardado junto com o valor consultado: resposta de um valor antigo não vale.
  const [result, setResult] = useState<{
    value: string;
    status: UsernameAvailability;
  } | null>(null);

  useEffect(() => {
    if (!valid) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      check(normalized, controller.signal)
        .then((status) => setResult({ value: normalized, status }))
        .catch(() => undefined); // cancelada: outro valor já está sendo consultado
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [normalized, valid, check]);

  if (!normalized) return 'idle';
  if (!isValidUsername(normalized)) return 'invalid';
  if (reserved) return 'reserved';
  return result?.value === normalized ? result.status : 'checking';
}
