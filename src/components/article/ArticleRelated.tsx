import React from 'react';
import { FAQItem } from '../../types/index';

interface ArticleRelatedProps {
  relatedArticles: FAQItem[];
  onNavigate: (article: FAQItem) => void;
}

export const ArticleRelated: React.FC<ArticleRelatedProps> = ({ relatedArticles, onNavigate }) => {
  if (relatedArticles.length === 0) return null;

  return (
    <div className="gsap-stagger-item mt-24 pt-12 border-t border-border no-print">
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-8">Veja também</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map(related => (
          <button
            key={related.id}
            onClick={() => onNavigate(related)}
            className="group flex flex-col items-start text-left p-8 rounded-2xl bg-bg-island/60 border border-border hover:bg-bg-island hover:border-text-main/20 hover:shadow-lg transition-all duration-500 w-full"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 mb-4">{related.category}</span>
            <h4 className="font-serif text-xl leading-tight mb-3 text-text-main group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{related.question}</h4>
            <p className="text-sm text-text-muted line-clamp-2 leading-relaxed font-light">{related.answer}</p>
          </button>
        ))}
      </div>
    </div>
  );
};
