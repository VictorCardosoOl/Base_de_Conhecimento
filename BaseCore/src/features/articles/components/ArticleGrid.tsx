'use client';
import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Check, Plus } from 'lucide-react';
import type { FAQItem } from '@/features/articles/types';
import { useReadingQueue } from '@/features/reading/use-reading-queue';

interface CardItemProps {
  item: FAQItem;
  /** Chamado ao abrir o artigo (além da navegação do link). */
  onClick?: () => void;
  isInQueue: boolean;
  onToggleQueue: (e?: React.MouseEvent) => void;
  index?: number;
}

/**
 * Card de artigo em vidro (superfície, sem desfoque). O título é um link de verdade
 * (teclado, leitor de tela, prefetch do Next) que cobre o card inteiro; o botão de salvar
 * fica por cima dele. Hover e entrada só em CSS (transform/opacity).
 */
export const CardItem: React.FC<CardItemProps> = ({ item, onClick, isInQueue, onToggleQueue, index = 0 }) => (
  <article
    className="enter-rise glass-card glass-interactive group relative flex h-full flex-col gap-4 p-6 sm:p-7 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-4 has-[a:focus-visible]:outline-[var(--mesh-1)]"
    style={{ ['--enter-index' as string]: index }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3 text-[11px] uppercase tracking-[0.16em]">
        <span className="glass-flat !rounded-full px-2.5 py-1 font-semibold text-text-main">{item.category}</span>
        <span className="truncate font-medium text-text-muted">{item.date}</span>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onToggleQueue(e);
        }}
        // Nome com o título e estado em aria-pressed; visível no foco do teclado e em
        // telas de toque (sem hover), não só ao passar o mouse.
        aria-label={
          isInQueue
            ? `Remover "${item.question}" da lista de leitura`
            : `Salvar "${item.question}" na lista de leitura`
        }
        aria-pressed={isInQueue}
        className={`relative z-10 shrink-0 rounded-full p-2 transition-[opacity,transform,background-color] duration-200 hover:scale-105 active:scale-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mesh-1)] ${
          isInQueue
            ? 'bg-[color-mix(in_srgb,var(--mesh-1)_14%,transparent)] text-[var(--mesh-1)]'
            : 'text-text-muted hover:bg-[var(--glass-bg-hover)] hover:text-text-main opacity-0 group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100'
        }`}
      >
        {isInQueue ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
      </button>
    </div>

    <h3 className="font-serif text-[1.45rem] sm:text-[1.6rem] leading-[1.15] tracking-[-0.01em] text-text-main">
      <Link
        href={`/artigo/${item.id}`}
        scroll={false}
        onClick={() => onClick?.()}
        // Link esticado: o card inteiro abre o artigo.
        className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none"
      >
        {item.question}
      </Link>
    </h3>
    <p className="line-clamp-3 text-[0.97rem] leading-relaxed text-text-muted">{item.answer}</p>

    <span
      aria-hidden="true"
      className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-text-main"
    >
      Ler artigo
      <ArrowUpRight
        size={14}
        className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
      />
    </span>
  </article>
);

export const ArticleGrid = ({
  items,
  onModalStateChange,
}: {
  items: FAQItem[];
  onModalStateChange?: (isOpen: boolean) => void;
}) => {
  const { queue, toggleQueue } = useReadingQueue();

  return (
    <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-5 2xl:grid-cols-3" role="list">
      {items.map((item, idx) => (
        <li key={item.id} className="h-full">
          <CardItem
            item={item}
            index={idx}
            onClick={() => onModalStateChange?.(true)}
            isInQueue={queue.includes(item.id)}
            onToggleQueue={() => toggleQueue(item.id)}
          />
        </li>
      ))}
    </ul>
  );
};
