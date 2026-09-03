import React from 'react';
import { Plus, Check, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FAQItem } from '../types';

interface ArticleCardProps {
  item: FAQItem;
  to?: string;            // Nova prop para link nativo
  onClick?: () => void;   // Opcional para manter compatibilidade
  isInQueue: boolean;
  onToggleQueue: (e: React.MouseEvent) => void;
  featured?: boolean;
}

export const ArticleCard: React.FC<ArticleCardProps> = ({ item, to, onClick, isInQueue, onToggleQueue, featured }) => {
  const CardContent = (
    <div className={`group cursor-pointer relative py-6 border-b border-[var(--border)] transition-all duration-700 lg:hover:pl-4`}>
      {/* Indicador de Hover Lateral */}
      <div className="absolute left-0 top-6 bottom-6 w-[2px] bg-[var(--text-main)] scale-y-0 lg:group-hover:scale-y-100 transition-transform duration-700 origin-top z-10" />

      <div className="space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-700 dark:text-stone-300">
                {item.category}
              </span>
              <div className="w-5 h-[0.5px] bg-stone-400 dark:bg-stone-600" />
              <span className="text-[10px] font-medium text-stone-600 dark:text-stone-400 tracking-widest">
                {item.date}
              </span>
            </div>

            <button
              onClick={onToggleQueue}
              className={`p-1.5 rounded-full transition-all duration-500 z-20 ${isInQueue ? 'text-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/30' : 'text-stone-500 hover:text-[var(--text-main)] hover:bg-stone-100 dark:hover:bg-white/5'
                }`}
            >
              {isInQueue ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="max-w-4xl space-y-2">
            <h3 className={`${featured ? 'text-2xl md:text-3xl lg:text-4xl' : 'text-lg md:text-xl lg:text-2xl'} font-serif font-light leading-tight text-[var(--text-main)] transition-transform duration-700 group-hover:translate-x-1`}>
              {item.question}
            </h3>

            <p className={`text-stone-700 dark:text-stone-300 font-light leading-relaxed line-clamp-2 transition-colors duration-500 group-hover:text-[var(--text-main)] ${featured ? 'text-lg md:text-xl max-w-3xl' : 'text-base max-w-2xl'}`}>
              {item.answer}
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-stone-600 dark:text-stone-300 opacity-0 lg:group-hover:opacity-100 transition-all duration-700 translate-y-1 lg:group-hover:translate-y-0">
            Explorar Diretriz <ArrowRight size={12} strokeWidth={1.5} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      {to ? (
        <Link to={to} className="block">
          {CardContent}
        </Link>
      ) : (
        <div onClick={onClick}>
          {CardContent}
        </div>
      )}
    </motion.div>
  );
};
