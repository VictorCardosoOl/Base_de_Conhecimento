import React from 'react';

import { Alert } from '@/components/ui/Alert';

/** Classes comuns às telas de acesso: as mesmas do design system (src/assets/styles/ui.css). */
export const AUTH_INPUT = 'ui-input';
export const AUTH_LABEL = 'ui-label';
export const AUTH_PRIMARY_BUTTON = 'ui-btn ui-btn--primary ui-btn--block';
export const AUTH_SECONDARY_BUTTON = 'ui-btn ui-btn--block';

/** Erro do formulário: anunciado na hora pelos leitores de tela. */
export function FormError({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return <Alert tone="danger">{children}</Alert>;
}

/** Sucesso ou andamento: anunciado sem interromper. */
export function FormNotice({ children }: { children: React.ReactNode }) {
  return <Alert tone="success">{children}</Alert>;
}

/** Cabeçalho das telas de acesso: ícone, título e descrição. */
export function AuthHeading({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center mb-8 text-center">
      <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-[color:var(--mesh-1)] bg-[color:var(--tone-info-bg)]">
        {icon}
      </div>
      <h1 className="text-2xl sm:text-3xl font-serif text-text-main">{title}</h1>
      {children && <p className="text-text-muted mt-2">{children}</p>}
    </div>
  );
}

/** Lê o token do fragmento (`#token=...`) e o apaga da barra de endereço e do histórico. */
export function takeTokenFromHash(): string | null {
  if (typeof window === 'undefined') return null;
  const token = new URLSearchParams(window.location.hash.slice(1)).get('token');
  if (window.location.hash) {
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search
    );
  }
  return token && /^[A-Za-z0-9_-]{20,128}$/.test(token) ? token : null;
}
