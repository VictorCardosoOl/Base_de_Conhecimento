import React from 'react';
import { Skeleton } from '@/components/ui/StateMessage';

/** Espera do conteúdo do artigo: blocos estáticos no formato do texto (sem animação). */
export const ArticleSkeleton: React.FC = () => (
  <div role="status" aria-label="Carregando artigo" className="max-w-3xl mx-auto py-12 space-y-6 min-h-[50vh] enter-rise">
    <Skeleton className="h-2.5 w-28" />
    <Skeleton className="h-9 w-4/5" />
    <div className="h-px bg-border" />
    <div className="space-y-3">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-5/6" />
    </div>
    <div className="pt-4 space-y-3">
      <Skeleton className="h-6 w-1/3" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
    </div>
  </div>
);
