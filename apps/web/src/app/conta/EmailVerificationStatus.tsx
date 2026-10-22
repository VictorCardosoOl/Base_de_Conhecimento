'use client';
import React, { useState } from 'react';
import { resendEmailVerification } from '@/features/auth/client';
import { hardNavigate } from '@/lib/navigation';

type SendState = 'idle' | 'sending' | 'sent' | 'error';

/**
 * Situação da confirmação do email e reenvio do link. Com o email confirmado, a conta pode
 * ser acessada também pelo login social (Google, GitHub) com o mesmo email (ADR-0013).
 */
export function EmailVerificationStatus({ verified }: { verified: boolean }) {
  const [state, setState] = useState<SendState>('idle');
  const [error, setError] = useState('');

  if (verified) {
    return (
      <p className="text-xs text-emerald-700 dark:text-emerald-400">
        Email confirmado.
      </p>
    );
  }

  const resend = async () => {
    setState('sending');
    setError('');
    const result = await resendEmailVerification();
    if (result.ok) {
      setState('sent');
      return;
    }
    if (result.reason === 'unauthenticated') {
      hardNavigate('/login?next=%2Fconta');
      return;
    }
    setState('error');
    setError(
      result.reason === 'rate_limited'
        ? 'Muitos reenvios seguidos. Aguarde alguns minutos.'
        : 'Serviço de autenticação indisponível. Tente novamente em instantes.'
    );
  };

  return (
    <div className="space-y-1">
      <p className="text-xs text-amber-800 dark:text-amber-300">
        Email ainda não confirmado. Confirme para proteger a conta e poder
        entrar com Google ou GitHub.
      </p>
      {state === 'sent' ? (
        <p role="status" className="text-xs text-text-main">
          Enviamos um novo link para o seu email.
        </p>
      ) : (
        <button
          type="button"
          onClick={() => void resend()}
          disabled={state === 'sending'}
          className="text-xs underline text-text-main hover:opacity-80 disabled:opacity-60"
        >
          {state === 'sending' ? 'Enviando…' : 'Reenviar link de confirmação'}
        </button>
      )}
      {error && (
        <p role="alert" className="text-xs text-red-700 dark:text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
