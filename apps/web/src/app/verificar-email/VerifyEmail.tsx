'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { MailCheck } from 'lucide-react';
import { verifyEmail } from '@/features/auth/client';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import {
  AUTH_PRIMARY_BUTTON,
  AUTH_SECONDARY_BUTTON,
  AuthHeading,
  FormError,
  FormNotice,
  takeTokenFromHash,
} from '@/features/auth/components/AuthFormParts';

type State =
  | 'verifying'
  | 'verified'
  | 'missing'
  | 'invalid'
  | 'rate_limited'
  | 'unavailable';

/**
 * Confirmação do email pelo link enviado no cadastro (`/verificar-email#token=...`).
 * Confirma sozinha ao abrir; não exige sessão.
 */
export function VerifyEmail() {
  const [state, setState] = useState<State>('verifying');
  const token = useRef<string | null>(null);

  const confirm = useCallback(async () => {
    if (!token.current) {
      setState('missing');
      return;
    }
    setState('verifying');
    const result = await verifyEmail(token.current);
    if (result.ok) setState('verified');
    else if (
      result.reason === 'invalid_token' ||
      result.reason === 'validation'
    )
      setState('invalid');
    else setState(result.reason);
  }, []);

  // Uma vez só: o fragmento é apagado ao ser lido (no modo estrito o efeito roda duas vezes).
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    token.current = takeTokenFromHash();
    void confirm();
  }, [confirm]);

  return (
    <AuthSplitLayout>
      <div className="w-full space-y-4">
        <AuthHeading
          icon={
            <MailCheck
              className="text-text-main"
              size={24}
              aria-hidden="true"
            />
          }
          title="Confirmação de email"
        />
        {state === 'verifying' && (
          <p role="status" className="text-sm text-text-muted text-center">
            Confirmando seu email…
          </p>
        )}
        {state === 'verified' && (
          <>
            <FormNotice>Email confirmado. Obrigado!</FormNotice>
            <Link href="/conta" className={AUTH_SECONDARY_BUTTON}>
              Ir para Minha conta
            </Link>
          </>
        )}
        {(state === 'missing' || state === 'invalid') && (
          <>
            <FormError>
              {state === 'missing'
                ? 'Abra esta página pelo link enviado ao seu email.'
                : 'Este link é inválido, já foi usado ou expirou. Peça um novo em Minha conta.'}
            </FormError>
            <Link href="/conta" className={AUTH_SECONDARY_BUTTON}>
              Ir para Minha conta
            </Link>
          </>
        )}
        {(state === 'rate_limited' || state === 'unavailable') && (
          <>
            <FormError>
              {state === 'rate_limited'
                ? 'Muitas tentativas seguidas. Aguarde alguns minutos e tente de novo.'
                : 'Serviço de autenticação indisponível. Tente novamente em instantes.'}
            </FormError>
            <button
              type="button"
              onClick={() => void confirm()}
              className={AUTH_PRIMARY_BUTTON}
            >
              Tentar de novo
            </button>
          </>
        )}
      </div>
    </AuthSplitLayout>
  );
}
