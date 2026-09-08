import React from 'react';
import { motion } from 'framer-motion';
import { FAQItem } from '../types/index';

interface ArticleRelatedProps {
  relatedArticles: FAQItem[];
  onNavigate: (article: FAQItem) => void;
  variants: any;
}

export const ArticleRelated: React.FC<ArticleRelatedProps> = ({ relatedArticles, onNavigate, variants }) => {
  if (relatedArticles.length === 0) return null;

  return (
    <motion.div variants={variants} className="mt-24 pt-12 border-t border-border no-print">
      <h3 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-8">Veja também</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map(related => (
          <button
            key={related.id}
            onClick={() => onNavigate(related)}
            className="group flex flex-col items-start text-left p-8 rounded-2xl bg-gray-50/50 border border-transparent hover:bg-white hover:border-gray-100 hover:shadow-lg hover:shadow-gray-100/50 transition-all duration-500 w-full"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600/60 mb-4">{related.category}</span>
            <h4 className="font-serif text-xl leading-tight mb-3 text-gray-900 group-hover:text-blue-700 transition-colors">{related.question}</h4>
            <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed font-light">{related.answer}</p>
          </button>
        ))}
      </div>
    </motion.div>
  );
};
