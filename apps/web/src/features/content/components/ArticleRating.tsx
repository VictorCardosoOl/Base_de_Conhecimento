'use client';
import React, { useId, useState } from 'react';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import {
  type ArticleSummary,
  contentErrorMessage,
  rateArticle,
  removeRating,
} from '@/features/content/content-client';

const LABELS = ['Não ajudou', 'Ajudou pouco', 'Razoável', 'Ajudou', 'Ajudou muito'];

const decimal = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

/** Estrelas só de leitura (média). */
function StarsView({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={16}
          className={
            n <= Math.round(value)
              ? 'fill-[color:var(--mesh-1)] text-[color:var(--mesh-1)]'
              : 'text-[color:color-mix(in_srgb,var(--text-main)_25%,transparent)]'
          }
        />
      ))}
    </span>
  );
}

/**
 * Avaliação do artigo: média pública com distribuição e, para quem tem sessão, a
 * própria nota (grupo de opções nativo: setas do teclado escolhem). Cada escolha é
 * gravada no servidor; o resultado volta já com a média nova.
 */
export function ArticleRating({
  articleId,
  summary,
  signedIn,
  loginHref,
  onSummary,
}: {
  articleId: string;
  summary: ArticleSummary;
  signedIn: boolean;
  loginHref: string;
  onSummary: (summary: ArticleSummary) => void;
}) {
  const toast = useToast();
  const name = useId();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [hover, setHover] = useState<number | null>(null);
  const { rating, my_rating: mine } = summary;
  const shown = hover ?? mine ?? 0;

  const choose = async (value: number) => {
    if (saving || value === mine) return;
    setSaving(true);
    setStatus('Salvando sua avaliação…');
    const result = await rateArticle(articleId, value);
    setSaving(false);
    if (result.ok) {
      onSummary(result.data);
      setStatus(`Sua avaliação: ${value} de 5 (${LABELS[value - 1]}).`);
      toast.show({ tone: 'success', title: 'Avaliação registrada', message: 'Obrigado! Ela ajuda a priorizar revisões.' });
    } else {
      setStatus('');
      toast.show({ tone: 'danger', title: 'Avaliação não registrada', message: contentErrorMessage(result, 'registrar a avaliação') });
    }
  };

  const clear = async () => {
    setSaving(true);
    const result = await removeRating(articleId);
    setSaving(false);
    if (result.ok) {
      onSummary(result.data);
      setStatus('Sua avaliação foi removida.');
    } else {
      toast.show({ tone: 'danger', title: 'Não foi possível remover', message: contentErrorMessage(result, 'remover a avaliação') });
    }
  };

  const max = Math.max(1, ...rating.distribution);

  return (
    <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <div>
        <p className="ui-label">Avaliação dos leitores</p>
        {rating.count > 0 && rating.average !== null ? (
          <div className="mt-2">
            <p className="flex items-center gap-3">
              <span className="text-4xl font-serif text-text-main tabular-nums">{decimal.format(rating.average)}</span>
              <span className="flex flex-col">
                <StarsView value={rating.average} />
                <span className="text-xs text-text-muted">
                  {rating.count} {rating.count === 1 ? 'avaliação' : 'avaliações'}
                </span>
              </span>
            </p>
            <span className="sr-only">
              Média {decimal.format(rating.average)} de 5, com {rating.count} {rating.count === 1 ? 'avaliação' : 'avaliações'}.
            </span>
            <ul className="mt-3 space-y-1" aria-label="Distribuição das notas">
              {[5, 4, 3, 2, 1].map((n) => {
                const count = rating.distribution[n - 1] ?? 0;
                return (
                  <li key={n} className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="w-3 tabular-nums">{n}</span>
                    <span className="h-1.5 flex-1 rounded-full bg-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)] overflow-hidden" aria-hidden="true">
                      <span className="block h-full rounded-full bg-[color:var(--mesh-1)] origin-left" style={{ transform: `scaleX(${count / max})` }} />
                    </span>
                    <span className="w-6 text-right tabular-nums">
                      {count}
                      <span className="sr-only"> {count === 1 ? 'voto' : 'votos'} com nota {n}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <p className="mt-2 text-sm text-text-muted">Ainda sem avaliações. A sua pode ser a primeira.</p>
        )}
      </div>

      <div>
        {signedIn ? (
          <fieldset disabled={saving} onMouseLeave={() => setHover(null)}>
            <legend className="ui-label">Este artigo ajudou você?</legend>
            <div className="mt-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <label
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  className="relative grid h-11 w-11 cursor-pointer place-items-center rounded-full transition-colors hover:bg-[color:color-mix(in_srgb,var(--mesh-1)_12%,transparent)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--mesh-1)]"
                >
                  <input
                    type="radio"
                    name={name}
                    value={n}
                    checked={mine === n}
                    onChange={() => choose(n)}
                    className="sr-only"
                    aria-label={`${n} de 5 — ${LABELS[n - 1]}`}
                  />
                  <Star
                    size={26}
                    aria-hidden="true"
                    className={
                      n <= shown
                        ? 'fill-[color:var(--mesh-1)] text-[color:var(--mesh-1)]'
                        : 'text-[color:color-mix(in_srgb,var(--text-main)_35%,transparent)]'
                    }
                  />
                </label>
              ))}
            </div>
            <p className="mt-1 min-h-5 text-sm text-text-muted" aria-live="polite">
              {status || (hover ? LABELS[hover - 1] : mine ? `Sua nota: ${mine} — ${LABELS[mine - 1]}` : 'Escolha de 1 a 5 estrelas.')}
            </p>
            {mine !== null && (
              <Button size="sm" variant="ghost" className="mt-1 -ml-2" onClick={clear}>
                Remover minha avaliação
              </Button>
            )}
          </fieldset>
        ) : (
          <div>
            <p className="ui-label">Este artigo ajudou você?</p>
            <p className="mt-2 text-sm text-text-muted">Entre na sua conta para avaliar. Uma nota por pessoa, que você pode mudar depois.</p>
            <Link href={loginHref} className="ui-btn ui-btn--sm mt-3">
              Entrar para avaliar
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
