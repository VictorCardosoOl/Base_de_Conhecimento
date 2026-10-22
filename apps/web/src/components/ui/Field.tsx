import React, { useId } from 'react';

export interface FieldControlProps {
  id: string;
  'aria-describedby': string | undefined;
  'aria-invalid': true | undefined;
  className: string;
}

interface FieldProps {
  label: React.ReactNode;
  /** Texto de ajuda sempre visível (ligado ao campo por aria-describedby). */
  hint?: React.ReactNode;
  /** Erro do campo: marca aria-invalid e é lido junto com o rótulo. */
  error?: React.ReactNode;
  /** Rótulo visualmente oculto (continua acessível). */
  hideLabel?: boolean;
  className?: string;
  /** Recebe os atributos de acessibilidade e devolve o controle (input, textarea, select). */
  children: (control: FieldControlProps) => React.ReactNode;
}

/** Rótulo + controle + ajuda + erro, sempre ligados entre si. */
export function Field({ label, hint, error, hideLabel, className = '', children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`ui-field ${className}`}>
      <label htmlFor={id} className={hideLabel ? 'sr-only' : 'ui-label'}>
        {label}
      </label>
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? true : undefined,
        className: 'ui-input',
      })}
      {hint && (
        <p id={hintId} className="ui-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="ui-field-error">
          {error}
        </p>
      )}
    </div>
  );
}
