"use client";
import React, { useEffect, useRef, useState } from 'react';

interface TemporaryPasswordDialogProps {
  email: string;
  password: string;
  reason: 'created' | 'reset';
  onClose: () => void;
}

/**
 * Apresenta a senha temporária ao administrador uma única vez.
 * Oculta por padrão; fica só no estado deste componente e some ao fechar (não vai
 * para URL, storage do navegador nem logs). Esc não fecha, para não perder a senha
 * por acidente: o fechamento é explícito.
 */
export function TemporaryPasswordDialog({ email, password, reason, onClose }: TemporaryPasswordDialogProps) {
  const [visible, setVisible] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopyStatus('copied');
    } catch {
      setCopyStatus('failed');
    }
  };

  const buttonClass =
    'px-3 py-2 text-sm rounded-lg border border-border text-text-main hover:bg-selection transition-colors';

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-[rgba(10,8,24,0.5)] p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="temp-password-title"
        aria-describedby="temp-password-help"
        tabIndex={-1}
        className="glass-strong glass-chroma !rounded-[2rem] p-6 max-w-md w-full space-y-4 focus:outline-none animate-fade-in-up"
      >
        <h2 id="temp-password-title" className="text-xl font-serif text-text-main">
          {reason === 'created' ? 'Usuário criado' : 'Senha redefinida'}
        </h2>
        <p id="temp-password-help" className="text-sm text-text-muted">
          Senha temporária de <strong className="text-text-main break-all">{email}</strong>. Repasse por
          um canal seguro: <strong>ela não será mostrada novamente</strong>. No primeiro acesso, a
          pessoa deverá trocá-la.
        </p>

        <div
          className="font-mono text-lg tracking-wider text-center p-3 rounded-lg bg-selection text-text-main select-all"
          aria-live="polite"
          data-testid="temporary-password"
        >
          {visible ? password : '••••-••••-••••-••••'}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <button type="button" className={buttonClass} aria-pressed={visible} onClick={() => setVisible((v) => !v)}>
            {visible ? 'Ocultar senha' : 'Mostrar senha'}
          </button>
          <button type="button" className={buttonClass} onClick={copy}>
            Copiar senha
          </button>
        </div>
        <p role="status" className="text-xs text-center text-text-muted min-h-4">
          {copyStatus === 'copied' && 'Senha copiada para a área de transferência.'}
          {copyStatus === 'failed' && 'Não foi possível copiar; use "Mostrar senha".'}
        </p>

        <button
          type="button"
          onClick={onClose}
          className="glass-button glass-button-primary w-full"
        >
          Concluído
        </button>
      </div>
    </div>
  );
}
