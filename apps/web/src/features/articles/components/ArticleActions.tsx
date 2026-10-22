'use client';
import React from 'react';
import { Bookmark, BookmarkCheck, Check, Printer, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { useReadingQueue } from '@/features/reading/use-reading-queue';
import { useShare } from '@/hooks/use-share';

/**
 * Ações sobre o artigo, perto do título: salvar na Minha Lista, compartilhar o link e
 * gerar PDF. Cada uma dá retorno visível (estado do botão e notificação).
 */
export function ArticleActions({
  articleId,
  title,
  summary,
}: {
  articleId: string;
  title: string;
  summary: string;
}) {
  const toast = useToast();
  const { queue, toggleQueue } = useReadingQueue();
  const { shareContent, shareFeedback } = useShare();
  const saved = queue.includes(articleId);

  return (
    <div role="toolbar" aria-label="Ações do artigo" className="flex flex-wrap gap-2 no-print">
      <Button
        size="sm"
        variant={saved ? 'primary' : 'secondary'}
        aria-pressed={saved}
        onClick={() => {
          toggleQueue(articleId);
          toast.show({
            tone: saved ? 'info' : 'success',
            title: saved ? 'Removido da Minha Lista' : 'Salvo na Minha Lista',
          });
        }}
      >
        {saved ? <BookmarkCheck size={15} aria-hidden="true" /> : <Bookmark size={15} aria-hidden="true" />}
        {saved ? 'Salvo' : 'Salvar'}
      </Button>
      <Button
        size="sm"
        onClick={() => shareContent(title, summary, `${window.location.origin}/artigo/${articleId}`)}
      >
        {shareFeedback ? <Check size={15} aria-hidden="true" /> : <Share2 size={15} aria-hidden="true" />}
        <span aria-live="polite">{shareFeedback ? 'Link copiado' : 'Compartilhar'}</span>
      </Button>
      <Button size="sm" variant="ghost" onClick={() => window.print()}>
        <Printer size={15} aria-hidden="true" /> PDF
      </Button>
    </div>
  );
}
