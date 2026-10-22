'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import {
  cancelSocialSignup,
  completeSocialSignup,
  fetchPendingSocialSignup,
  type PendingSocialSignup,
  type ProfessionalArea,
} from '@/features/auth/client';
import {
  displayNameProblem,
  isValidUsername,
  normalizeUsername,
} from '@/features/auth/identity';
import { useUsernameAvailability } from '@/features/auth/use-username-availability';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import {
  AUTH_INPUT,
  AUTH_LABEL,
  AUTH_PRIMARY_BUTTON,
  AUTH_SECONDARY_BUTTON,
  AuthHeading,
  FormError,
} from '@/features/auth/components/AuthFormParts';
import { IdentityFields } from '@/features/auth/components/IdentityFields';
import { ProfileFields } from '@/features/auth/components/ProfileFields';
import { TermsConsent } from '@/features/auth/components/TermsConsent';
import {
  signupMessage,
  TERMS_REQUIRED,
  USERNAME_RESERVED,
  USERNAME_TAKEN,
} from '@/features/auth/signup-messages';
import { sanitizeNextPath } from '@/features/auth/redirect';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/features/legal/documents';
import { hardNavigate } from '@/lib/navigation';

type Load =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'unavailable' }
  | { status: 'ready'; pending: PendingSocialSignup };

/**
 * Última etapa do cadastro por login social: o provedor já confirmou o email; falta
 * escolher o usuário (único), o nome e aceitar os termos. A conta só é criada (e a sessão
 * aberta) ao concluir. Os dados vêm do AuthService, por um cookie HttpOnly do cadastro
 * pendente: nada fica na URL nem no armazenamento do navegador.
 */
export function SocialSignupForm() {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [professionalArea, setProfessionalArea] = useState<
    ProfessionalArea | ''
  >('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  const usernameStatus = useUsernameAvailability(username);

  useEffect(() => {
    let active = true;
    fetchPendingSocialSignup().then((result) => {
      if (!active) return;
      if (!result.ok) {
        setLoad({ status: result.reason });
        return;
      }
      setUsername(result.pending.suggestedUsername ?? '');
      setDisplayName(result.pending.suggestedDisplayName ?? '');
      setLoad({ status: 'ready', pending: result.pending });
    });
    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const nameProblem = displayNameProblem(displayName);
    const usernameBad =
      !isValidUsername(username) ||
      usernameStatus === 'taken' ||
      usernameStatus === 'reserved';
    setDisplayNameError(nameProblem);
    setTermsError(acceptTerms ? null : TERMS_REQUIRED);
    if (usernameBad || nameProblem || !acceptTerms) {
      setError('Corrija os campos destacados.');
      if (usernameBad) usernameRef.current?.focus();
      else if (!acceptTerms && !nameProblem) termsRef.current?.focus();
      return;
    }
    setError('');
    setUsernameError(null);
    setBusy(true);
    const result = await completeSocialSignup({
      username: normalizeUsername(username),
      displayName: displayName.trim(),
      acceptTerms,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      organization,
      professionalArea,
    });
    if (result.ok) {
      // Sessão aberta pelo AuthService; navegação completa para o servidor enxergá-la.
      hardNavigate(sanitizeNextPath(result.nextPath, '/conta'));
      return;
    }
    setBusy(false);
    if (
      result.reason === 'username_taken' ||
      result.reason === 'username_reserved'
    ) {
      setUsernameError(
        result.reason === 'username_taken' ? USERNAME_TAKEN : USERNAME_RESERVED
      );
      usernameRef.current?.focus();
      return;
    }
    if (result.reason === 'expired') {
      setLoad({ status: 'none' });
      return;
    }
    setError(signupMessage(result));
  };

  const handleCancel = async () => {
    setBusy(true);
    await cancelSocialSignup();
    hardNavigate('/login');
  };

  return (
    <AuthSplitLayout>
      <div className="w-full">
        <AuthHeading
          icon={
            <UserPlus className="text-text-main" size={24} aria-hidden="true" />
          }
          title="Concluir cadastro"
        >
          {load.status === 'ready'
            ? `Você entrou com ${load.pending.providerName}. Falta escolher como quer ser chamado e aceitar os termos.`
            : undefined}
        </AuthHeading>

        {load.status === 'loading' && (
          <p role="status" className="text-sm text-text-muted text-center">
            Carregando seus dados…
          </p>
        )}

        {(load.status === 'none' || load.status === 'unavailable') && (
          <div className="space-y-4">
            <FormError>
              {load.status === 'none'
                ? 'O cadastro com o provedor expirou ou já foi concluído. Comece de novo pelo botão do provedor.'
                : 'Serviço de autenticação indisponível. Tente novamente em instantes.'}
            </FormError>
            <Link href="/cadastro" className={AUTH_SECONDARY_BUTTON}>
              Voltar ao cadastro
            </Link>
          </div>
        )}

        {load.status === 'ready' && (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <FormError>{error}</FormError>
            <div className="space-y-1">
              <p className={AUTH_LABEL}>Email</p>
              <p
                className="text-text-main break-all"
                data-testid="social-email"
              >
                {load.pending.email}
              </p>
              <p className="text-xs text-text-muted">
                Confirmado pelo {load.pending.providerName}. Sua conta começa
                com acesso de leitura.
              </p>
            </div>
            <IdentityFields
              idPrefix="social"
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
              inputClass={AUTH_INPUT}
              labelClass={AUTH_LABEL}
            />
            <ProfileFields
              idPrefix="social"
              organization={organization}
              professionalArea={professionalArea}
              onOrganizationChange={setOrganization}
              onProfessionalAreaChange={setProfessionalArea}
              inputClass={AUTH_INPUT}
              labelClass={AUTH_LABEL}
            />
            <TermsConsent
              id="social-terms"
              checked={acceptTerms}
              onChange={(value) => {
                setAcceptTerms(value);
                if (value) setTermsError(null);
              }}
              error={termsError}
              inputRef={termsRef}
            />
            <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={() => void handleCancel()}
                disabled={busy}
                className={`sm:flex-1 ${AUTH_SECONDARY_BUTTON}`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className={`sm:flex-1 ${AUTH_PRIMARY_BUTTON}`}
              >
                {busy ? 'Criando…' : 'Criar conta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
}
