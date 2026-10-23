'use client';
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ErrorState, Skeleton } from '@/components/ui/StateMessage';
import { useCurrentSession } from '@/features/auth/use-session-summary';
import { type ArticleSummary, fetchArticleSummary } from '@/features/content/content-client';
import { ArticleComments } from './ArticleComments';
import { ArticleRating } from './ArticleRating';
import { SuggestCorrection } from './SuggestCorrection';

/**
 * Tudo o que o leitor faz com o artigo, num lugar só e no fim da leitura: avaliar,
 * sugerir correção e comentar. Mesmo componente na página do artigo e no modal.
 */
export function ArticleInteractions({
  articleId,
  articleTitle,
  contentRef,
}: {
  articleId: string;
  articleTitle: string;
  contentRef?: React.RefObject<HTMLElement | null>;
}) {
  const session = useCurrentSession();
  const signedIn = session?.authenticated === true;
  const [summary, setSummary] = useState<ArticleSummary | null>(null);
  const [failed, setFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const loginHref = `/login?${new URLSearchParams({ next: `/artigo/${articleId}` })}`;

  useEffect(() => {
    let active = true;
    fetchArticleSummary(articleId).then((result) => {
      if (!active) return;
      if (result.ok) {
        setSummary(result.data);
        setFailed(false);
      } else {
        setFailed(true);
      }
    });
    return () => {
      active = false;
    };
    // Com a sessão, o resumo traz a nota da própria pessoa.
  }, [articleId, signedIn, reloadKey]);

  return (
    <div className="flex flex-col gap-10 border-t border-border pt-10 sm:pt-14 mt-12 sm:mt-16">
      <section aria-labelledby={`feedback-${articleId}`} className="below-fold">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-6 border-b border-border/60">
          <div>
            <h2 id={`feedback-${articleId}`} className="text-xl font-serif text-text-main">
              Avalie e contribua
            </h2>
            <p className="mt-1 text-sm text-text-muted max-w-xl font-light">
              Sua nota orienta as revisões. Encontrou algo errado ou desatualizado? Envie uma correção para a equipe editorial.
            </p>
          </div>
          <SuggestCorrection
            articleId={articleId}
            articleTitle={articleTitle}
            signedIn={signedIn}
            loginHref={loginHref}
            contentRef={contentRef}
          />
        </div>
        <div className="mt-6">
          {summary ? (
            <ArticleRating
              articleId={articleId}
              summary={summary}
              signedIn={signedIn}
              loginHref={loginHref}
              onSummary={setSummary}
            />
          ) : failed ? (
            <ErrorState
              title="Avaliações indisponíveis no momento"
              className="!py-6"
              action={
                <Button size="sm" onClick={() => setReloadKey((key) => key + 1)}>
                  Tentar novamente
                </Button>
              }
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2" role="status" aria-label="Carregando avaliações">
              <Skeleton className="h-20 w-full !rounded-2xl" />
              <Skeleton className="h-20 w-full !rounded-2xl" />
            </div>
          )}
        </div>
      </section>

      <ArticleComments
        articleId={articleId}
        session={session}
        loginHref={loginHref}
        onCountChange={(count) => setSummary((current) => (current ? { ...current, comment_count: count } : current))}
      />
    </div>
  );
}
