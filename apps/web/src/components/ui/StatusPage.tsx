import React from 'react';

/**
 * Página de estado (404, 403, erro): código discreto, título, explicação e próximos
 * passos. Mesmo visual em todas, sem animação contínua.
 */
export function StatusPage({
  code,
  title,
  children,
  actions,
  role,
}: {
  code: string;
  title: string;
  children?: React.ReactNode;
  actions?: React.ReactNode;
  role?: 'alert';
}) {
  return (
    <section role={role} className="min-h-[65vh] flex items-center justify-center py-12">
      <div className="glass-card w-full max-w-xl px-6 py-12 sm:px-12 text-center">
        <p aria-hidden="true" className="font-serif text-[clamp(4rem,3rem+6vw,7rem)] leading-none text-[color:color-mix(in_srgb,var(--mesh-1)_70%,var(--text-main))]">
          {code}
        </p>
        <h1 className="mt-4 text-2xl sm:text-3xl font-serif text-text-main">{title}</h1>
        {children && <div className="mt-3 text-text-muted leading-relaxed">{children}</div>}
        {actions && <div className="mt-8 flex flex-wrap items-center justify-center gap-3">{actions}</div>}
      </div>
    </section>
  );
}
