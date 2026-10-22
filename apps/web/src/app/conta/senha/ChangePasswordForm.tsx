"use client";
import React, { useRef, useState } from 'react';
import { KeyRound } from 'lucide-react';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  changePassword,
  type ChangePasswordResult,
} from '@/features/auth/client';
import { PASSWORD_CHANGE_PATH } from '@/features/auth/redirect';
import { hardNavigate } from '@/lib/navigation';
import { tooManyAttemptsMessage } from '@/features/auth/presentation';

type Failed = Exclude<ChangePasswordResult, { ok: true }>;

const LENGTH_MESSAGE = `A nova senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;

// Mensagens próprias: não repassamos texto do servidor para a tela.
function messageFor(result: Failed): string {
  switch (result.reason) {
    case 'wrong_current':
      return 'Senha atual incorreta.';
    case 'validation':
      return LENGTH_MESSAGE;
    case 'rate_limited':
      return tooManyAttemptsMessage(result.retryAfterSeconds);
    case 'unauthenticated':
      return 'Sua sessão terminou. Entre novamente.';
    case 'unavailable':
      return 'Serviço de autenticação indisponível. Tente novamente em instantes.';
  }
}

function localError(current: string, next: string, confirm: string): string | null {
  if (next.length < PASSWORD_MIN_LENGTH || next.length > PASSWORD_MAX_LENGTH) return LENGTH_MESSAGE;
  if (next !== confirm) return 'A confirmação não confere com a nova senha.';
  if (next === current) return 'A nova senha deve ser diferente da atual.';
  return null;
}

/** `next` já chega validado pela página (somente caminhos internos). */
export function ChangePasswordForm({ required, next }: { required: boolean; next: string }) {
  const [current, setCurrent] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const currentRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const invalid = localError(current, newPassword, confirm);
    if (invalid) {
      setError(invalid);
      return;
    }
    setError('');
    setIsSaving(true);

    const result = await changePassword(current, newPassword);
    if (result.ok) {
      // Navegação completa: o servidor volta a checar a sessão, agora sem a pendência.
      hardNavigate(next);
      return;
    }
    if (result.reason === 'unauthenticated') {
      const back = `${PASSWORD_CHANGE_PATH}?${new URLSearchParams({ next })}`;
      hardNavigate(`/login?${new URLSearchParams({ next: back })}`);
      return;
    }
    setCurrent('');
    setNewPassword('');
    setConfirm('');
    setError(messageFor(result));
    setIsSaving(false);
    currentRef.current?.focus();
  };

  const inputClass =
    'ui-input';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-text-muted';

  return (
    <div className="flex items-center justify-center min-h-[70vh] p-4">
      <div data-reveal className="glass-card glass-chroma p-8 max-w-md w-full">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-[color:var(--mesh-1)] bg-[color:var(--tone-info-bg)]">
            <KeyRound className="text-text-main" size={24} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-serif text-text-main">
            {required ? 'Defina uma nova senha' : 'Trocar senha'}
          </h1>
          <p className="text-text-muted mt-2">
            {required
              ? 'Sua senha foi definida por um administrador. Para continuar, escolha uma senha só sua.'
              : 'Ao trocar a senha, suas sessões em outros dispositivos são encerradas.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {error && (
            <div role="alert" data-tone="danger" className="ui-alert justify-center">
              {error}
            </div>
          )}
          <div className="space-y-1">
            <label htmlFor="current-password" className={labelClass}>Senha atual</label>
            <input
              id="current-password"
              ref={currentRef}
              type="password"
              autoComplete="current-password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="new-password" className={labelClass}>Nova senha</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              aria-describedby="new-password-hint"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={PASSWORD_MIN_LENGTH}
              maxLength={PASSWORD_MAX_LENGTH}
              className={inputClass}
            />
            <p id="new-password-hint" className="text-xs text-text-muted">
              Pelo menos {PASSWORD_MIN_LENGTH} caracteres.
            </p>
          </div>
          <div className="space-y-1">
            <label htmlFor="confirm-password" className={labelClass}>Confirme a nova senha</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={isSaving}
            className="glass-button glass-button-primary w-full !min-h-12 mt-4 disabled:opacity-60"
          >
            {isSaving ? 'Salvando…' : 'Salvar nova senha'}
          </button>
        </form>
      </div>
    </div>
  );
}
