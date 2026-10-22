'use client';
import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';

/**
 * Diálogo modal sobre o <dialog> nativo: o navegador prende o foco, fecha no Esc,
 * deixa o resto da página inerte e devolve o foco a quem abriu.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className = '',
}: {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
    } else if (!open && dialog.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descId : undefined}
      className={`ui-dialog ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Esc fecha só este diálogo, não o que estiver por baixo (ex.: o artigo em modal).
      onKeyDown={(event) => {
        if (event.key === 'Escape') event.stopPropagation();
      }}
      onClick={(event) => {
        // Clique no fundo (fora da caixa) fecha.
        if (event.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <h2 id={titleId} className="text-xl font-serif text-text-main leading-snug">
              {title}
            </h2>
            <Button variant="ghost" size="sm" icon aria-label="Fechar" onClick={onClose} className="-mr-2 -mt-1">
              <X size={18} aria-hidden="true" />
            </Button>
          </div>
          {description && (
            <p id={descId} className="mt-2 text-sm text-text-muted leading-relaxed">
              {description}
            </p>
          )}
          {children && <div className="mt-5">{children}</div>}
          {footer && <div className="mt-6 flex flex-wrap justify-end gap-2">{footer}</div>}
        </div>
      )}
    </dialog>
  );
}

/** Confirmação de ação (excluir, rejeitar...): o botão de confirmar diz o que acontece. */
export function ConfirmDialog({
  open,
  onCancel,
  onConfirm,
  title,
  description,
  confirmLabel,
  danger = false,
  busy = false,
}: {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      footer={
        <>
          <Button onClick={onCancel} disabled={busy}>
            Cancelar
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={busy} loadingText="Aguarde…">
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
