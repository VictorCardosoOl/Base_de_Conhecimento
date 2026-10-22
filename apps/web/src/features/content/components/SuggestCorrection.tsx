'use client';
import React, { useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, FilePenLine } from 'lucide-react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { Field } from '@/components/ui/Field';
import { useToast } from '@/components/ui/Toast';
import {
  CORRECTION_KINDS,
  CORRECTION_MAX_LENGTH,
  CORRECTION_MIN_LENGTH,
  type CorrectionKind,
  contentErrorMessage,
  EXCERPT_MAX_LENGTH,
  suggestCorrection,
} from '@/features/content/content-client';

/** Texto selecionado dentro do artigo (vira o "trecho afetado" já preenchido). */
function selectedExcerpt(within: HTMLElement | null): string {
  const selection = typeof window !== 'undefined' ? window.getSelection() : null;
  if (!selection || selection.isCollapsed || !within) return '';
  const node = selection.anchorNode;
  if (!node || !within.contains(node)) return '';
  return selection.toString().trim().slice(0, EXCERPT_MAX_LENGTH);
}

/**
 * "Sugerir correção": o artigo é identificado sozinho; a pessoa escolhe o tipo, descreve
 * o problema e, se quiser, indica o trecho (selecionar o texto antes já o preenche).
 * A sugestão vai para a fila de revisão de editores e admins.
 */
export function SuggestCorrection({
  articleId,
  articleTitle,
  signedIn,
  loginHref,
  contentRef,
}: {
  articleId: string;
  articleTitle: string;
  signedIn: boolean;
  loginHref: string;
  /** Corpo do artigo, para aproveitar o texto selecionado. */
  contentRef?: React.RefObject<HTMLElement | null>;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<CorrectionKind>('erro');
  const [description, setDescription] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [errors, setErrors] = useState<{ description?: string; excerpt?: string; form?: string }>({});
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const pendingExcerpt = useRef('');
  const inFlight = useRef(false);

  const start = () => {
    setKind('erro');
    setDescription('');
    setExcerpt(pendingExcerpt.current);
    setErrors({});
    setSent(false);
    setOpen(true);
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (inFlight.current) return;
    const text = description.trim();
    const next: typeof errors = {};
    if (text.length < CORRECTION_MIN_LENGTH) {
      next.description = `Descreva o problema com pelo menos ${CORRECTION_MIN_LENGTH} caracteres.`;
    } else if (text.length > CORRECTION_MAX_LENGTH) {
      next.description = `Use no máximo ${CORRECTION_MAX_LENGTH} caracteres.`;
    }
    if (excerpt.trim().length > EXCERPT_MAX_LENGTH) next.excerpt = `O trecho pode ter até ${EXCERPT_MAX_LENGTH} caracteres.`;
    setErrors(next);
    if (next.description || next.excerpt) return;

    inFlight.current = true;
    setSending(true);
    const result = await suggestCorrection(articleId, { kind, description: text, excerpt: excerpt.trim() || null });
    inFlight.current = false;
    setSending(false);
    if (result.ok) {
      setSent(true);
      toast.show({ tone: 'success', title: 'Sugestão enviada', message: 'A equipe editorial vai revisar. Acompanhe em Minha conta.' });
      return;
    }
    const message = contentErrorMessage(result, 'enviar a sugestão');
    if (result.field === 'description') setErrors({ description: message });
    else if (result.field === 'excerpt') setErrors({ excerpt: message });
    else setErrors({ form: message });
  };

  if (!signedIn) {
    return (
      <Link href={loginHref} className="ui-btn ui-btn--sm">
        <FilePenLine size={15} aria-hidden="true" /> Entrar para sugerir correção
      </Link>
    );
  }

  return (
    <>
      <Button
        size="sm"
        // Captura a seleção antes do clique (o foco no botão pode desfazê-la).
        onPointerDown={() => {
          pendingExcerpt.current = selectedExcerpt(contentRef?.current ?? null);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') pendingExcerpt.current = selectedExcerpt(contentRef?.current ?? null);
        }}
        onClick={start}
        aria-haspopup="dialog"
      >
        <FilePenLine size={15} aria-hidden="true" /> Sugerir correção
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={sent ? 'Sugestão enviada' : 'Sugerir correção'}
        description={
          sent ? undefined : (
            <>
              Artigo: <strong className="text-text-main">{articleTitle}</strong>
            </>
          )
        }
        footer={
          sent ? (
            <Button variant="primary" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          ) : (
            <>
              <Button onClick={() => setOpen(false)} disabled={sending}>
                Cancelar
              </Button>
              <Button type="submit" form={`correction-${articleId}`} variant="primary" loading={sending} loadingText="Enviando…">
                Enviar sugestão
              </Button>
            </>
          )
        }
      >
        {sent ? (
          <div className="flex gap-3 items-start">
            <CheckCircle2 className="text-[color:var(--tone-success)] shrink-0" aria-hidden="true" />
            <p className="text-sm text-text-body leading-relaxed">
              Obrigado! A sugestão entrou na fila de revisão da equipe editorial. Você acompanha o andamento em{' '}
              <Link href="/conta" className="ui-link">
                Minha conta
              </Link>
              .
            </p>
          </div>
        ) : (
          <form id={`correction-${articleId}`} onSubmit={submit} noValidate className="flex flex-col gap-4">
            {errors.form && <Alert tone="danger">{errors.form}</Alert>}
            <Field label="Tipo de problema">
              {(control) => (
                <select {...control} value={kind} onChange={(event) => setKind(event.target.value as CorrectionKind)}>
                  {CORRECTION_KINDS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field
              label="O que precisa ser corrigido? (obrigatório)"
              hint={`Diga o que está errado e, se souber, o correto e a fonte. ${description.trim().length}/${CORRECTION_MAX_LENGTH}`}
              error={errors.description}
            >
              {(control) => (
                <textarea
                  {...control}
                  required
                  rows={4}
                  value={description}
                  maxLength={CORRECTION_MAX_LENGTH + 100}
                  onChange={(event) => setDescription(event.target.value)}
                  autoFocus
                />
              )}
            </Field>
            <Field
              label="Trecho afetado (opcional)"
              hint="Dica: selecione o texto no artigo antes de abrir este formulário."
              error={errors.excerpt}
            >
              {(control) => (
                <textarea
                  {...control}
                  rows={2}
                  value={excerpt}
                  maxLength={EXCERPT_MAX_LENGTH + 100}
                  onChange={(event) => setExcerpt(event.target.value)}
                />
              )}
            </Field>
          </form>
        )}
      </Dialog>
    </>
  );
}
