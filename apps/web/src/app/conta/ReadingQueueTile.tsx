'use client';
import React from 'react';
import Link from 'next/link';
import { Bookmark, ArrowUpRight } from 'lucide-react';
import { useReadingQueue } from '@/features/reading/use-reading-queue';
import { AnimatedNumber } from '@/components/ui/glass/GlassMetrics';

/** Bloco "Minha Lista" da conta: a lista vive no navegador, por isso é um componente cliente. */
export function ReadingQueueTile() {
  const { queue } = useReadingQueue();
  return (
    <Link
      href="/minha-lista"
      className="glass-card glass-interactive glass-focus flex h-full flex-col justify-between gap-6 p-6"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
          Minha Lista
        </span>
        <span className="w-9 h-9 rounded-full glass-flat !rounded-full flex items-center justify-center text-text-main">
          <Bookmark size={16} aria-hidden="true" />
        </span>
      </div>
      <div>
        <AnimatedNumber value={queue.length} className="block text-5xl font-semibold tracking-tight text-text-main tabular-nums" />
        <span className="mt-1 inline-flex items-center gap-1 text-sm text-text-muted">
          {queue.length === 1 ? 'artigo salvo para ler' : 'artigos salvos para ler'}
          <ArrowUpRight size={14} aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
