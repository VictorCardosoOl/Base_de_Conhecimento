'use client';
import React, { useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { COMMENT_MAX_LENGTH, COMMENT_MAX_LINKS, countLinks } from '@/features/content/content-client';

/** Mesmas regras do servidor, checadas antes de enviar (o servidor confere de novo). */
export function validateComment(text: string): string | null {
  const body = text.trim();
  if (body.length < 2) return 'Escreva um comentário.';
  if (body.length > COMMENT_MAX_LENGTH) return `Use no máximo ${COMMENT_MAX_LENGTH} caracteres.`;
  if (countLinks(body) > COMMENT_MAX_LINKS) return `Use no máximo ${COMMENT_MAX_LINKS} links por comentário.`;
  return null;
}

/**
 * Caixa de texto de comentário (novo, resposta ou edição). Valida, mostra o limite e
 * fica travada enquanto envia: um clique duplo não publica duas vezes.
 */
export function CommentComposer({
  label,
  submitLabel,
  initialValue = '',
  onSubmit,
  onCancel,
  autoFocus = false,
  compact = false,
}: {
  label: string;
  submitLabel: string;
  initialValue?: string;
  /** Devolve uma mensagem de erro para exibir, ou null quando deu certo. */
  onSubmit: (body: string) => Promise<string | null>;
  onCancel?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Trava síncrona: dois cliques no mesmo quadro não passam pelo estado ainda antigo.
  const inFlight = useRef(false);
  const length = value.trim().length;
  const over = length > COMMENT_MAX_LENGTH;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    const problem = validateComment(value);
    if (problem) {
      setError(problem);
      return;
    }
    inFlight.current = true;
    setSending(true);
    setError(null);
    const failure = await onSubmit(value.trim());
    inFlight.current = false;
    setSending(false);
    if (failure) setError(failure);
    else if (!initialValue) setValue('');
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-2">
      <label htmlFor={id} className={compact ? 'sr-only' : 'ui-label'}>
        {label}
      </label>
      <textarea
        id={id}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && onCancel) {
            event.stopPropagation();
            onCancel();
          }
        }}
        // Atalho de quem escreve muito: Ctrl/Cmd+Enter envia.
        onKeyUp={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            (event.currentTarget.form as HTMLFormElement | null)?.requestSubmit();
          }
        }}
        rows={compact ? 3 : 4}
        maxLength={COMMENT_MAX_LENGTH + 200}
        autoFocus={autoFocus}
        aria-invalid={error ? true : undefined}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`}
        placeholder={compact ? label : 'Compartilhe uma dúvida, um complemento ou a sua experiência…'}
        className="ui-input"
        disabled={sending}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-help`} className="ui-hint">
          Texto simples, até {COMMENT_MAX_LINKS} links ·{' '}
          <span className={over ? 'text-[color:var(--tone-danger)] font-semibold' : undefined}>
            {length}/{COMMENT_MAX_LENGTH}
          </span>
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={sending}>
              Cancelar
            </Button>
          )}
          <Button type="submit" size="sm" variant="primary" loading={sending} loadingText="Enviando…">
            {submitLabel}
          </Button>
        </div>
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="ui-field-error">
          {error}
        </p>
      )}
    </form>
  );
}
