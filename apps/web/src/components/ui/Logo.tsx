import React from 'react';

/**
 * Marca da Base SST: escudo (segurança do trabalho) com um sinal de verificação
 * (conteúdo conferido). Desenho próprio, em duas cores do tema: acompanha claro/escuro.
 */
export function LogoMark({ size = 28, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      <path
        d="M16 2.5 27 6.6v8.2c0 7.1-4.6 12.4-11 14.7C9.6 27.2 5 21.9 5 14.8V6.6L16 2.5Z"
        fill="var(--mesh-1)"
      />
      <path d="M16 2.5 27 6.6v8.2c0 7.1-4.6 12.4-11 14.7V2.5Z" fill="var(--glass-accent-deep)" opacity="0.55" />
      <path
        d="M10.2 15.6 14.3 19.6 22 11.3"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Marca + nome. O texto fica visível; quem usa decide o rótulo do link ao redor. */
export function Logo({ compact = false, className = '' }: { compact?: boolean; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark />
      {!compact && (
        <span className="font-sans text-[15px] font-bold tracking-tight text-text-main leading-none">
          Base <span className="text-[color:var(--mesh-1)]">SST</span>
        </span>
      )}
    </span>
  );
}
