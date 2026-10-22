"use client";
import React, { useEffect, useRef, useState } from 'react';
import { AuthSplitLayout } from '@/features/auth/components/AuthSplitLayout';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { login, refreshSession, type LoginResult } from '@/features/auth/client';
import { clearAuthReturn, isAuthReturnLoop, markAuthReturn } from '@/features/auth/return-guard';
import { hardNavigate } from '@/lib/navigation';
import { PASSWORD_CHANGE_PATH } from '@/features/auth/redirect';
import { SocialLoginButtons } from '@/features/auth/components/SocialLoginButtons';
import { tooManyAttemptsMessage } from '@/features/auth/presentation';

type FailedLogin = Exclude<LoginResult, { ok: true }>;

// Mensagens próprias: não repassamos texto do servidor para a tela.
function messageFor(result: FailedLogin): string {
    switch (result.reason) {
        case 'invalid_credentials':
            return 'Email ou senha inválidos.';
        case 'rate_limited':
            return tooManyAttemptsMessage(result.retryAfterSeconds);
        case 'validation':
            return 'Verifique o email e a senha informados.';
        case 'unavailable':
            return 'Serviço de autenticação indisponível. Tente novamente em instantes.';
    }
}

const SESSION_NOT_KEPT =
    'Não foi possível manter a sessão neste navegador. Tente entrar novamente; se o problema continuar, contate o administrador.';

/** Volta ao destino registrando a volta, para detectar um loop login ↔ destino. */
function returnTo(next: string) {
    markAuthReturn(next);
    hardNavigate(next);
}

/**
 * `next` já chega validado pela página (somente caminhos internos). `initialError` (falha
 * do login social) e `notice` (ex.: senha redefinida) também vêm prontos da página.
 */
export function LoginForm({
    next,
    initialError = null,
    notice = null,
}: {
    next: string;
    initialError?: string | null;
    notice?: string | null;
}) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(initialError ?? '');
    const [isLoading, setIsLoading] = useState(false);
    const [isCheckingSession, setIsCheckingSession] = useState(true);
    const passwordRef = useRef<HTMLInputElement>(null);

    // Sessão ainda válida (só o access expirou): renova em silêncio e volta ao destino.
    useEffect(() => {
        let active = true;
        refreshSession().then((renewed) => {
            if (!active) return;
            if (renewed && isAuthReturnLoop(next)) {
                // Acabamos de voltar ao destino e o servidor nos mandou de novo ao login:
                // a sessão existe no AuthService, mas o Next não a enxerga. Parar aqui.
                console.error(
                    '[auth] Sessão renovada, mas o destino voltou ao login. Verifique se AUTH_ACCESS_COOKIE_NAME ' +
                        'é igual ao cookie do AuthService e se cookies Secure/__Host- estão sendo servidos via HTTPS.'
                );
                clearAuthReturn();
                setError(SESSION_NOT_KEPT);
                setIsCheckingSession(false);
            } else if (renewed) {
                // Navegação completa: um router.replace aqui pode ser sobreposto pela
                // navegação que trouxe o usuário ao login (redirect do proxy em andamento).
                returnTo(next);
            } else {
                clearAuthReturn();
                setIsCheckingSession(false);
            }
        });
        return () => {
            active = false;
        };
    }, [next]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const result = await login(email.trim(), password);
        if (result.ok) {
            // Senha definida por um administrador: troca antes de seguir (o servidor também exige).
            returnTo(
                result.user.must_change_password
                    ? `${PASSWORD_CHANGE_PATH}?${new URLSearchParams({ next })}`
                    : next
            );
            return;
        }

        setPassword('');
        setError(messageFor(result));
        setIsLoading(false);
        passwordRef.current?.focus();
    };

    return (
        <AuthSplitLayout>
            <div className="w-full">
                <div className="flex flex-col items-center mb-8">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-[color:var(--mesh-1)] bg-[color:var(--tone-info-bg)]">
                        <LogIn className="text-text-main" size={24} aria-hidden="true" />
                    </div>
                    <h1 className="text-2xl font-serif text-text-main">Entrar</h1>
                    <p className="text-text-muted mt-2 text-center">Acesse sua conta da Base de Conhecimento.</p>
                </div>

                {isCheckingSession ? (
                    <p className="text-sm text-text-muted text-center" role="status">
                        Verificando sessão…
                    </p>
                ) : (
                    <>
                    {notice && !error && (
                        <p role="status" data-tone="success" className="ui-alert justify-center mb-4">
                            {notice}
                        </p>
                    )}
                    <SocialLoginButtons next={next} mode="login" />
                    <form onSubmit={handleLogin} className="space-y-4">
                        {error && (
                            <div role="alert" data-tone="danger" className="ui-alert justify-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1">
                            <label htmlFor="login-email" className="ui-label">Email</label>
                            <input
                                id="login-email"
                                type="email"
                                autoComplete="username"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="ui-input"
                            />
                        </div>
                        <div className="space-y-1">
                            <label htmlFor="login-password" className="ui-label">Senha</label>
                            <input
                                id="login-password"
                                ref={passwordRef}
                                type="password"
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="ui-input"
                            />
                            <div className="flex justify-end pt-1">
                                <Link
                                    href={`/esqueci-senha?${new URLSearchParams({ next })}`}
                                    className="text-sm underline text-text-muted hover:text-text-main"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="ui-btn ui-btn--primary ui-btn--block mt-4"
                        >
                            {isLoading ? 'Entrando…' : 'Entrar'}
                        </button>
                        <div className="pt-4 mt-2 border-t border-border text-center space-y-2">
                            <p className="text-sm text-text-muted">Não tem conta?</p>
                            <Link
                                href={`/cadastro?${new URLSearchParams({ next })}`}
                                className="ui-btn ui-btn--block"
                            >
                                Criar conta
                            </Link>
                        </div>
                    </form>
                    </>
                )}
            </div>
        </AuthSplitLayout>
    );
}
