"use client";
import React, { useState } from 'react';
import { logout, logoutAll } from '@/features/auth/client';
import { hardNavigate } from '@/lib/navigation';

interface LogoutButtonProps {
    className?: string;
    children?: React.ReactNode;
    /** `all`: encerra as sessões de todos os dispositivos, não só a deste navegador. */
    scope?: 'current' | 'all';
}

/**
 * Revoga a sessão no AuthService (cookies limpos pelo servidor) e volta ao login.
 * Se a revogação falhar, fica na tela e avisa: a sessão ainda está ativa.
 */
export function LogoutButton({ className, children = 'Sair', scope = 'current' }: LogoutButtonProps) {
    const [isLeaving, setIsLeaving] = useState(false);
    const [failed, setFailed] = useState(false);

    return (
        <>
            <button
                type="button"
                disabled={isLeaving}
                className={className}
                onClick={async () => {
                    setIsLeaving(true);
                    setFailed(false);
                    if (await (scope === 'all' ? logoutAll() : logout())) {
                        // Navegação completa: descarta o cache do roteador feito com a sessão encerrada.
                        hardNavigate('/login');
                        return;
                    }
                    setFailed(true);
                    setIsLeaving(false);
                }}
            >
                {children}
            </button>
            {failed && (
                <span role="alert" className="text-sm text-red-700 dark:text-red-300">
                    Não foi possível encerrar a sessão. Tente novamente.
                </span>
            )}
        </>
    );
}
