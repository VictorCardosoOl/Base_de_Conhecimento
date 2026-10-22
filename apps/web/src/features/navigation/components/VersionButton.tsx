'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { APP_RELEASE_NOTES_URL, APP_VERSION_LABEL } from '@/lib/app-version';

const buttonClass =
  'inline-flex min-h-8 items-center gap-1.5 rounded-full border border-[color:color-mix(in_srgb,var(--text-main)_14%,transparent)] px-3 font-mono text-[11px] tabular-nums text-text-muted cursor-pointer transition-[background-color,color,border-color,transform] duration-200 hover:text-text-main hover:border-[color:color-mix(in_srgb,var(--text-main)_28%,transparent)] hover:bg-[var(--glass-bg-hover)] active:scale-95 glass-focus';

/**
 * Versão da aplicação no rodapé, como botão discreto. Com notas de versão configuradas
 * (APP_RELEASE_NOTES_URL), abre essa página; sem elas, copia a versão (para relatar
 * problemas ao suporte), com confirmação visível e anunciada.
 */
export function VersionButton() {
  const toast = useToast();
  const [copied, setCopied] = useState(false);

  if (APP_RELEASE_NOTES_URL) {
    return (
      <Link href={APP_RELEASE_NOTES_URL} className={buttonClass} aria-label={`Versão ${APP_VERSION_LABEL}: ver notas da versão`}>
        {APP_VERSION_LABEL}
      </Link>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(APP_VERSION_LABEL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast.show({ tone: 'success', title: 'Versão copiada', message: `${APP_VERSION_LABEL} — informe-a ao relatar um problema.` });
    } catch {
      toast.show({ title: `Versão ${APP_VERSION_LABEL}`, message: 'Não foi possível copiar automaticamente.' });
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      className={buttonClass}
      aria-label={`Versão ${APP_VERSION_LABEL}: copiar`}
      title="Copiar a versão"
    >
      {copied && <Check size={12} aria-hidden="true" />}
      {APP_VERSION_LABEL}
    </button>
  );
}
