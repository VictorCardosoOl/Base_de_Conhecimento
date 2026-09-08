import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { FAQItem } from '../types/index';

interface ArticleFooterNavProps {
  nav: { prev: FAQItem | null; next: FAQItem | null };
  onNavigateAttempt: (direction: 'prev' | 'next') => void;
}

export const ArticleFooterNav: React.FC<ArticleFooterNavProps> = ({ nav, onNavigateAttempt }) => {
  return (
    <footer
      className="gsap-stagger-item mt-16 pt-12 border-t border-border grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 no-print"
    >
      <button
        onClick={() => onNavigateAttempt('prev')}
        disabled={!nav.prev}
        className={`group text-left space-y-3 p-6 -ml-6 rounded-2xl transition-all duration-300 block w-full cursor-pointer disabled:opacity-40 disabled:grayscale disabled:hover:bg-transparent disabled:cursor-not-allowed hover:bg-bg-island`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-text-main transition-colors flex items-center gap-2">
          <ArrowLeft size={14} className={nav.prev ? "group-hover:-translate-x-1 transition-transform" : ""} />
          Anterior
        </span>
        <h4 className="text-xl font-serif text-text-main leading-tight group-hover:underline decoration-1 underline-offset-4">
          {nav.prev ? nav.prev.question : "Início do Módulo"}
        </h4>
      </button>

      <button
        onClick={() => onNavigateAttempt('next')}
        disabled={!nav.next}
        className={`group text-right md:text-right space-y-3 p-6 -mr-6 rounded-2xl transition-all duration-300 block w-full flex flex-col items-end cursor-pointer disabled:opacity-40 disabled:grayscale disabled:hover:bg-transparent disabled:cursor-not-allowed hover:bg-bg-island`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted group-hover:text-text-main transition-colors flex items-center gap-2 justify-end">
          Próximo
          <ArrowRight size={14} className={nav.next ? "group-hover:translate-x-1 transition-transform" : ""} />
        </span>
        <h4 className="text-xl font-serif text-text-main leading-tight group-hover:underline decoration-1 underline-offset-4">
          {nav.next ? nav.next.question : "Final do Módulo"}
        </h4>
      </button>
    </footer>
  );
};
