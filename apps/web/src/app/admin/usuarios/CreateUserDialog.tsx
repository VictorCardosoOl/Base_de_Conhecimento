'use client';
import React, { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Role } from '@/features/auth/session';
import type { UserActionResult } from '@/features/auth/user-actions';
import {
  displayNameProblem,
  isValidUsername,
  normalizeUsername,
} from '@/features/auth/identity';
import { useUsernameAvailability } from '@/features/auth/use-username-availability';
import { IdentityFields } from '@/features/auth/components/IdentityFields';
import { ACTION_MESSAGES } from '@/features/auth/action-feedback';

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: 'user', label: 'Leitor' },
  { value: 'editor', label: 'Editor' },
  { value: 'admin', label: 'Administrador' },
];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Step = 'credentials' | 'identity';

interface CreateUserDialogProps {
  /** Executa a Server Action (com renovação de sessão); null = saiu da tela. */
  onSubmit: (input: {
    email: string;
    role: Role;
    username: string;
    displayName: string;
  }) => Promise<UserActionResult | null>;
  onCreated: (email: string, temporaryPassword: string) => void;
  onClose: () => void;
}

/**
 * Cadastro pelo admin, em duas etapas como o cadastro público: 1) email e papel (a senha
 * temporária é gerada no servidor e mostrada uma vez depois); 2) usuário e nome.
 */
export function CreateUserDialog({
  onSubmit,
  onCreated,
  onClose,
}: CreateUserDialogProps) {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('user');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const usernameStatus = useUsernameAvailability(username);
  const onCloseRef = useRef(onClose);
  const busyRef = useRef(busy);
  useEffect(() => {
    onCloseRef.current = onClose;
    busyRef.current = busy;
  });

  // Foco no primeiro campo da etapa; Esc fecha (exceto enviando); Tab fica dentro do modal.
  useEffect(() => {
    (step === 'identity' ? usernameRef : emailRef).current?.focus();
  }, [step]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled])'
      );
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError('Informe um email válido.');
      return;
    }
    setError('');
    setStep('identity');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameProblem = displayNameProblem(displayName);
    const usernameBad =
      !isValidUsername(username) || usernameStatus === 'taken';
    setDisplayNameError(nameProblem);
    if (usernameBad || nameProblem) {
      setError('Corrija os campos destacados.');
      if (usernameBad) usernameRef.current?.focus();
      return;
    }
    setError('');
    setBusy(true);
    try {
      const target = email.trim();
      const result = await onSubmit({
        email: target,
        role,
        username: normalizeUsername(username),
        displayName: displayName.trim(),
      });
      if (!result) return;
      if (result.ok) {
        if (result.temporaryPassword)
          onCreated(target, result.temporaryPassword);
        return;
      }
      if (result.error === 'username_taken') {
        setUsernameError(ACTION_MESSAGES.username_taken);
        usernameRef.current?.focus();
      } else if (result.error === 'email_taken') {
        setStep('credentials');
        setError(ACTION_MESSAGES.email_taken);
      } else {
        setError(ACTION_MESSAGES[result.error]);
      }
    } catch {
      setError(ACTION_MESSAGES.unavailable);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'ui-input';
  const labelClass =
    'text-xs font-bold uppercase tracking-wider text-text-muted';
  const primaryButton =
    'flex-1 ui-btn ui-btn--primary';
  const secondaryButton =
    'flex-1 ui-btn';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(10,8,24,0.5)] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-user-title"
        aria-describedby="create-user-step"
        className="glass-strong glass-chroma !rounded-[2rem] p-6 max-w-md w-full space-y-4 max-h-[90vh] overflow-y-auto animate-fade-in-up"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="create-user-title"
              className="text-xl font-serif text-text-main"
            >
              {step === 'credentials'
                ? 'Cadastrar usuário'
                : 'Como a pessoa será chamada?'}
            </h2>
            <p
              id="create-user-step"
              className="text-xs uppercase tracking-wider text-text-muted mt-1"
            >
              Etapa {step === 'credentials' ? 1 : 2} de 2
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Fechar cadastro"
            className="p-2 rounded-full border border-border text-text-main hover:bg-selection transition-colors disabled:opacity-60"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            data-tone="danger" className="ui-alert"
          >
            {error}
          </div>
        )}

        {step === 'credentials' ? (
          <form onSubmit={handleContinue} className="space-y-4" noValidate>
            <div className="space-y-1">
              <label htmlFor="new-user-email" className={labelClass}>
                Email
              </label>
              <input
                id="new-user-email"
                ref={emailRef}
                type="email"
                autoComplete="off"
                required
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="new-user-role" className={labelClass}>
                Papel
              </label>
              <select
                id="new-user-role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className={inputClass}
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <p className="text-xs text-text-muted">
              A senha temporária é gerada automaticamente e mostrada uma única
              vez ao concluir. No primeiro acesso, a pessoa deverá trocá-la.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className={secondaryButton}
              >
                Cancelar
              </button>
              <button type="submit" className={primaryButton}>
                Continuar
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <IdentityFields
              idPrefix="new-user"
              username={username}
              displayName={displayName}
              onUsernameChange={(value) => {
                setUsername(value);
                setUsernameError(null);
              }}
              onDisplayNameChange={(value) => {
                setDisplayName(value);
                setDisplayNameError(null);
              }}
              usernameStatus={usernameStatus}
              usernameError={usernameError}
              displayNameError={displayNameError}
              usernameRef={usernameRef}
              inputClass={inputClass}
              labelClass={labelClass}
              forSomeoneElse
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setStep('credentials');
                }}
                disabled={busy}
                className={secondaryButton}
              >
                Voltar
              </button>
              <button type="submit" disabled={busy} className={primaryButton}>
                {busy ? 'Cadastrando…' : 'Cadastrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
