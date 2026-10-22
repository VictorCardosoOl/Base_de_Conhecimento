'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { LockKeyhole } from 'lucide-react';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  resetPassword,
  type TokenActionResult,
} from '@/features/auth/client';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import {
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_PRIMARY_BUTTON,
  AUTH_SECONDARY_BUTTON,
  AuthHeading,
  FormError,
  takeTokenFromHash,
} from '@/features/auth/components/AuthFormParts';
import { hardNavigate } from '@/lib/navigation';

const LENGTH_MESSAGE = `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;
const INVALID_LINK =
  'Este link é inválido, já foi usado ou expirou. Peça um novo link para redefinir a senha.';

function messageFor(result: Exclude<TokenActionResult, { ok: true }>): string {
  switch (result.reason) {
    case 'invalid_token':
      return INVALID_LINK;
    case 'validation':
      return LENGTH_MESSAGE;
    case 'rate_limited':
      return 'Muitas tentativas seguidas. Tente novamente em alguns minutos.';
    case 'unavailable':
      return 'Serviço de autenticação indisponível. Tente novamente em instantes.';
  }
}

type LinkState = 'reading' | 'missing' | 'ready' | 'invalid';

/**
 * Nova senha a partir do link do email (`/redefinir-senha#token=...`). O token fica no
 * fragmento (não vai a logs nem ao Referer) e é apagado da barra de endereço ao abrir.
 * Mesmas regras de senha do cadastro. Ao concluir, todas as sessões foram encerradas: a
 * pessoa entra de novo com a senha nova.
 */
export function ResetPasswordForm() {
  const [token, setToken] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<LinkState>('reading');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  // Uma vez só: o fragmento é apagado ao ser lido (no modo estrito o efeito roda duas vezes).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const found = takeTokenFromHash();
    setToken(found);
    setLinkState(found ? 'ready' : 'missing');
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (
      password.length < PASSWORD_MIN_LENGTH ||
      password.length > PASSWORD_MAX_LENGTH
    ) {
      setError(LENGTH_MESSAGE);
      passwordRef.current?.focus();
      return;
    }
    if (password !== confirm) {
      setError('A confirmação não confere com a senha.');
      return;
    }
    if (!token) return;
    setError('');
    setBusy(true);
    const result = await resetPassword(token, password);
    if (result.ok) {
      hardNavigate('/login?aviso=senha-redefinida');
      return;
    }
    setBusy(false);
    if (result.reason === 'invalid_token') {
      setLinkState('invalid');
      return;
    }
    setError(messageFor(result));
  };

  return (
    <AuthSplitLayout>
      <div className="w-full">
        <AuthHeading
          icon={
            <LockKeyhole
              className="text-text-main"
              size={24}
              aria-hidden="true"
            />
          }
          title="Criar nova senha"
        >
          Escolha uma senha nova para a sua conta.
        </AuthHeading>

        {linkState === 'reading' && (
          <p role="status" className="text-sm text-text-muted text-center">
            Verificando o link…
          </p>
        )}

        {(linkState === 'missing' || linkState === 'invalid') && (
          <div className="space-y-4">
            <FormError>
              {linkState === 'missing'
                ? 'Abra esta página pelo link enviado ao seu email.'
                : INVALID_LINK}
            </FormError>
            <Link href="/esqueci-senha" className={AUTH_SECONDARY_BUTTON}>
              Pedir um novo link
            </Link>
          </div>
        )}

        {linkState === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormError>{error}</FormError>
            <div className="space-y-1">
              <label htmlFor="reset-password" className={AUTH_LABEL}>
                Nova senha
              </label>
              <input
                id="reset-password"
                ref={passwordRef}
                type="password"
                autoComplete="new-password"
                aria-describedby="reset-password-hint"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                className={AUTH_INPUT}
              />
              <p id="reset-password-hint" className="text-xs text-text-muted">
                Pelo menos {PASSWORD_MIN_LENGTH} caracteres.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="reset-confirm" className={AUTH_LABEL}>
                Confirme a nova senha
              </label>
              <input
                id="reset-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                required
                className={AUTH_INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className={AUTH_PRIMARY_BUTTON}
            >
              {busy ? 'Salvando…' : 'Salvar nova senha'}
            </button>
            <p className="text-xs text-text-muted text-center">
              Ao salvar, as sessões abertas em outros aparelhos são encerradas.
            </p>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
}
