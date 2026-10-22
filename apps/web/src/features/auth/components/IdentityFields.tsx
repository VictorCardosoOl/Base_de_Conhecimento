'use client';
import React from 'react';
import {
  DISPLAY_NAME_MAX_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_RULES,
} from '@/features/auth/identity';
import type { UsernameStatus } from '@/features/auth/use-username-availability';

interface IdentityFieldsProps {
  idPrefix: string;
  username: string;
  displayName: string;
  onUsernameChange: (value: string) => void;
  onDisplayNameChange: (value: string) => void;
  usernameStatus: UsernameStatus;
  /** Erro vindo do envio (ex.: usuário ocupado entre a consulta e o cadastro). */
  usernameError?: string | null;
  displayNameError?: string | null;
  usernameRef?: React.Ref<HTMLInputElement>;
  inputClass: string;
  labelClass: string;
  /** Cadastro de outra pessoa (admin): sem preenchimento automático com os dados de quem usa. */
  forSomeoneElse?: boolean;
}

const STATUS_TEXT: Record<
  UsernameStatus,
  { text: string; tone: 'muted' | 'ok' | 'error' }
> = {
  idle: { text: USERNAME_RULES, tone: 'muted' },
  invalid: { text: USERNAME_RULES, tone: 'error' },
  checking: { text: 'Verificando disponibilidade…', tone: 'muted' },
  available: { text: 'Disponível.', tone: 'ok' },
  taken: { text: 'Este usuário já está em uso. Escolha outro.', tone: 'error' },
  reserved: { text: 'Este nome é reservado. Escolha outro.', tone: 'error' },
  rate_limited: {
    text: 'Muitas consultas seguidas. A disponibilidade será conferida ao concluir.',
    tone: 'muted',
  },
  error: {
    text: 'Não foi possível verificar agora. A disponibilidade será conferida ao concluir.',
    tone: 'muted',
  },
};

// Administradores podem usar nomes reservados (ex.: uma conta de suporte).
const ADMIN_RESERVED = {
  text: 'Nome reservado no cadastro público; administradores podem usá-lo. A disponibilidade será conferida ao salvar.',
  tone: 'muted' as const,
};

const TONE_CLASS = {
  muted: 'text-text-muted',
  ok: 'text-emerald-700 dark:text-emerald-400',
  error: 'text-red-700 dark:text-red-300',
};

/** Usuário (único, com disponibilidade em tempo real) e nome de exibição. */
export function IdentityFields({
  idPrefix,
  username,
  displayName,
  onUsernameChange,
  onDisplayNameChange,
  usernameStatus,
  usernameError,
  displayNameError,
  usernameRef,
  inputClass,
  labelClass,
  forSomeoneElse = false,
}: IdentityFieldsProps) {
  const status = usernameError
    ? { text: usernameError, tone: 'error' as const }
    : forSomeoneElse && usernameStatus === 'reserved'
      ? ADMIN_RESERVED
      : STATUS_TEXT[usernameStatus];
  const usernameInvalid = status.tone === 'error';

  return (
    <>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-username`} className={labelClass}>
          Usuário
        </label>
        <input
          id={`${idPrefix}-username`}
          ref={usernameRef}
          type="text"
          autoComplete={forSomeoneElse ? 'off' : 'username'}
          autoCapitalize="none"
          spellCheck={false}
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          required
          maxLength={USERNAME_MAX_LENGTH + 10}
          aria-invalid={usernameInvalid || undefined}
          aria-describedby={`${idPrefix}-username-status`}
          className={inputClass}
        />
        <p
          id={`${idPrefix}-username-status`}
          aria-live="polite"
          className={`text-xs ${TONE_CLASS[status.tone]}`}
          data-testid="username-status"
        >
          {status.text}
        </p>
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-display-name`} className={labelClass}>
          Nome
        </label>
        <input
          id={`${idPrefix}-display-name`}
          type="text"
          autoComplete={forSomeoneElse ? 'off' : 'name'}
          value={displayName}
          onChange={(e) => onDisplayNameChange(e.target.value)}
          required
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          aria-invalid={displayNameError ? true : undefined}
          aria-describedby={`${idPrefix}-display-name-hint`}
          className={inputClass}
        />
        <p
          id={`${idPrefix}-display-name-hint`}
          className={`text-xs ${displayNameError ? TONE_CLASS.error : TONE_CLASS.muted}`}
        >
          {displayNameError ??
            'Nome de exibição, mostrado no sistema. Não precisa ser único.'}
        </p>
      </div>
    </>
  );
}
