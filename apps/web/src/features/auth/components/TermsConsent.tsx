'use client';
import React from 'react';

const LINK = 'underline text-text-main hover:opacity-80';

/**
 * Aceite obrigatório dos Termos de Uso e da Política de Privacidade. Os documentos abrem
 * em outra aba, para não perder o que já foi preenchido.
 */
export function TermsConsent({
  id,
  checked,
  onChange,
  error,
  inputRef,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string | null;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  const errorId = `${id}-error`;
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-3">
        <input
          id={id}
          ref={inputRef}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          required
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-current text-text-main"
        />
        <label
          htmlFor={id}
          className="text-sm text-text-main leading-snug cursor-pointer"
        >
          Li e aceito os{' '}
          <a
            href="/termos"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            Termos de Uso<span className="sr-only"> (abre em nova aba)</span>
          </a>{' '}
          e a{' '}
          <a
            href="/privacidade"
            target="_blank"
            rel="noopener noreferrer"
            className={LINK}
          >
            Política de Privacidade
            <span className="sr-only"> (abre em nova aba)</span>
          </a>
          .
        </label>
      </div>
      {error && (
        <p id={errorId} className="text-xs text-red-700 dark:text-red-300 pl-8">
          {error}
        </p>
      )}
    </div>
  );
}
