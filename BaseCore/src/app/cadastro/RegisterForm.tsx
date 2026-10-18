"use client";
import React, { useEffect, useRef, useState } from 'react';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import Link from 'next/link';
import { UserPlus } from 'lucide-react';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  register,
  type ProfessionalArea,
} from '@/features/auth/client';
import { displayNameProblem, isValidUsername, normalizeUsername } from '@/features/auth/identity';
import { useUsernameAvailability } from '@/features/auth/use-username-availability';
import { IdentityFields } from '@/features/auth/components/IdentityFields';
import { ProfileFields } from '@/features/auth/components/ProfileFields';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { TermsConsent } from '@/features/auth/components/TermsConsent';
import {
  signupMessage,
  TERMS_REQUIRED,
  USERNAME_RESERVED,
  USERNAME_TAKEN,
} from '@/features/auth/signup-messages';
import { PRIVACY_VERSION, TERMS_VERSION } from '@/features/legal/documents';
import { hardNavigate } from '@/lib/navigation';

type Step = 'credentials' | 'identity';

const LENGTH_MESSAGE = `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Cadastro em duas etapas: 1) email e senha (ou um provedor social); 2) como a pessoa quer
 * ser chamada (usuário único e nome), perfil opcional e o aceite obrigatório dos termos.
 * A conta só é criada ao concluir a segunda etapa.
 * `next` já chega validado pela página (somente caminhos internos).
 */
export function RegisterForm({ next }: { next: string }) {
  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [organization, setOrganization] = useState('');
  const [professionalArea, setProfessionalArea] = useState<ProfessionalArea | ''>('');
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [termsError, setTermsError] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const usernameRef = useRef<HTMLInputElement>(null);
  const termsRef = useRef<HTMLInputElement>(null);
  const usernameStatus = useUsernameAvailability(username);

  // Ao trocar de etapa, o foco vai para o primeiro campo dela.
  const firstStep = useRef(true);
  useEffect(() => {
    if (firstStep.current) {
      firstStep.current = false;
      return;
    }
    (step === 'identity' ? usernameRef : emailRef).current?.focus();
  }, [step]);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) {
      setError('Informe um email válido.');
      return;
    }
    if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
      setError(LENGTH_MESSAGE);
      return;
    }
    if (password !== confirm) {
      setError('A confirmação não confere com a senha.');
      return;
    }
    setError('');
    setStep('identity');
  };

  const handleBack = () => {
    setError('');
    setStep('credentials');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameProblem = displayNameProblem(displayName);
    const usernameBad =
      !isValidUsername(username) || usernameStatus === 'taken' || usernameStatus === 'reserved';
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
    setIsSaving(true);

    const result = await register({
      email: email.trim(),
      password,
      username: normalizeUsername(username),
      displayName: displayName.trim(),
      acceptTerms,
      termsVersion: TERMS_VERSION,
      privacyVersion: PRIVACY_VERSION,
      organization,
      professionalArea,
    });
    if (result.ok) {
      // O AuthService já abriu a sessão; navegação completa para o servidor enxergá-la.
      hardNavigate(next);
      return;
    }
    setIsSaving(false);
    if (result.reason === 'username_taken' || result.reason === 'username_reserved') {
      // Ocupado entre a consulta e o envio (ou reservado): o AuthService decidiu.
      setUsernameError(result.reason === 'username_taken' ? USERNAME_TAKEN : USERNAME_RESERVED);
      usernameRef.current?.focus();
      return;
    }
    if (result.reason === 'email_taken') {
      // O email é da primeira etapa: volta para ela, com a senha limpa.
      setPassword('');
      setConfirm('');
      setStep('credentials');
    }
    setError(signupMessage(result));
  };

  const inputClass =
    'ui-input';
  const labelClass = 'text-xs font-bold uppercase tracking-wider text-text-muted';
  const primaryButton =
    'ui-btn ui-btn--primary';
  const loginHref = `/login?${new URLSearchParams({ next })}`;

  const alert = error && (
    <div
      role="alert"
      data-tone="danger" className="ui-alert justify-center"
    >
      {error}
    </div>
  );

  return (
    <AuthSplitLayout>
      <div className="w-full">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-[color:var(--mesh-1)] bg-[color:var(--tone-info-bg)]">
            <UserPlus className="text-text-main" size={24} aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-serif text-text-main">
            {step === 'credentials' ? 'Criar conta' : 'Como você quer ser chamado?'}
          </h1>
          <p className="text-xs uppercase tracking-wider text-text-muted mt-2">
            Etapa {step === 'credentials' ? 1 : 2} de 2
          </p>
          <p className="text-text-muted mt-2">
            {step === 'credentials'
              ? 'Sua conta começa com acesso de leitura. Para editar artigos, peça acesso de editor em Minha conta.'
              : 'Escolha um usuário único (usado em buscas e referências) e o nome que aparece para as outras pessoas.'}
          </p>
        </div>

        {step === 'credentials' && <SocialLoginButtons next={next} mode="signup" />}

        {step === 'credentials' ? (
          <form onSubmit={handleContinue} className="space-y-4" noValidate>
            {alert}
            <div className="space-y-1">
              <label htmlFor="register-email" className={labelClass}>Email</label>
              <input
                id="register-email"
                ref={emailRef}
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                maxLength={254}
                className={inputClass}
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="register-password" className={labelClass}>Senha</label>
              <input
                id="register-password"
                type="password"
                autoComplete="new-password"
                aria-describedby="register-password-hint"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={PASSWORD_MIN_LENGTH}
                maxLength={PASSWORD_MAX_LENGTH}
                className={inputClass}
              />
              <p id="register-password-hint" className="text-xs text-text-muted">
                Pelo menos {PASSWORD_MIN_LENGTH} caracteres.
              </p>
            </div>
            <div className="space-y-1">
              <label htmlFor="register-confirm" className={labelClass}>Confirme a senha</label>
              <input
                id="register-confirm"
                type="password"
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className={inputClass}
              />
            </div>
            <button type="submit" className={`w-full mt-4 ${primaryButton}`}>
              Continuar
            </button>
            <p className="text-sm text-text-muted text-center pt-2">
              Já tem conta?{' '}
              <Link href={loginHref} className="underline text-text-main">
                Entrar
              </Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {alert}
            <IdentityFields
              idPrefix="register"
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
            />
            <ProfileFields
              idPrefix="register"
              organization={organization}
              professionalArea={professionalArea}
              onOrganizationChange={setOrganization}
              onProfessionalAreaChange={setProfessionalArea}
              inputClass={inputClass}
              labelClass={labelClass}
            />
            <TermsConsent
              id="register-terms"
              checked={acceptTerms}
              onChange={(value) => {
                setAcceptTerms(value);
                if (value) setTermsError(null);
              }}
              error={termsError}
              inputRef={termsRef}
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={handleBack}
                disabled={isSaving}
                className="flex-1 ui-btn"
              >
                Voltar
              </button>
              <button type="submit" disabled={isSaving} className={`flex-1 ${primaryButton}`}>
                {isSaving ? 'Criando…' : 'Criar conta'}
              </button>
            </div>
          </form>
        )}
      </div>
    </AuthSplitLayout>
  );
}
