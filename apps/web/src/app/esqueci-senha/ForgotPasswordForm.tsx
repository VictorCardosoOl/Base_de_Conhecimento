'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import {
  requestPasswordReset,
  type ForgotPasswordResult,
} from '@/features/auth/client';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import {
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_PRIMARY_BUTTON,
  AUTH_SECONDARY_BUTTON,
  AuthHeading,
  FormError,
  FormNotice,
} from '@/features/auth/components/AuthFormParts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function messageFor(
  result: Exclude<ForgotPasswordResult, { ok: true }>
): string {
  switch (result.reason) {
    case 'validation':
      return 'Informe um email válido.';
    case 'rate_limited':
      return result.retryAfterSeconds
        ? `Muitos pedidos seguidos. Tente novamente em ${Math.ceil(result.retryAfterSeconds / 60)} min.`
        : 'Muitos pedidos seguidos. Tente novamente em alguns minutos.';
    case 'unavailable':
      return 'Serviço de autenticação indisponível. Tente novamente em instantes.';
  }
}

/**
 * Pedido do link de redefinição. A confirmação é sempre a mesma, exista ou não uma conta
 * com o email: a tela não revela quem está cadastrado.
 */
export function ForgotPasswordForm({ next }: { next: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const loginHref = `/login?${new URLSearchParams({ next })}`;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError('Informe um email válido.');
      emailRef.current?.focus();
      return;
    }
    setError('');
    setBusy(true);
    const result = await requestPasswordReset(email.trim());
    setBusy(false);
    if (result.ok) {
      setSent(true);
      return;
    }
    setError(messageFor(result));
    emailRef.current?.focus();
  };

  return (
    <AuthSplitLayout>
      <div className="w-full">
        <AuthHeading
          icon={
            <KeyRound className="text-text-main" size={24} aria-hidden="true" />
          }
          title="Esqueceu a senha?"
        >
          Informe o email da sua conta. Enviaremos um link para criar uma nova
          senha.
        </AuthHeading>

        {sent ? (
          <div className="space-y-4">
            <FormNotice>
              Se houver uma conta com este email, enviamos um link para criar
              uma nova senha. Ele vale por 30 minutos e pode ser usado uma vez.
              Confira também a caixa de spam.
            </FormNotice>
            <Link href={loginHref} className={AUTH_SECONDARY_BUTTON}>
              Voltar para o login
            </Link>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="w-full text-sm underline text-text-muted hover:text-text-main"
            >
              Não recebeu? Pedir de novo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormError>{error}</FormError>
            <div className="space-y-1">
              <label htmlFor="forgot-email" className={AUTH_LABEL}>
                Email
              </label>
              <input
                id="forgot-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                maxLength={254}
                aria-invalid={error ? true : undefined}
                className={AUTH_INPUT}
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className={AUTH_PRIMARY_BUTTON}
            >
              {busy ? 'Enviando…' : 'Enviar link'}
            </button>
            <p className="text-sm text-text-muted text-center pt-2">
              Lembrou a senha?{' '}
              <Link href={loginHref} className="underline text-text-main">
                Entrar
              </Link>
            </p>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
}
