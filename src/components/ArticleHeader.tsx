import React from 'react';
import { motion } from 'framer-motion';

interface ArticleHeaderProps {
  category: string;
  question: string;
  answer: string;
  variants: any;
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({ category, question, answer, variants }) => {
  return (
    <header className="mb-20 md:mb-28 text-center max-w-4xl mx-auto">
      <motion.div variants={variants} className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-6">
        <span>{category}</span>
        <span className="w-1 h-1 rounded-full bg-current opacity-40" />
        <span>Leitura Rápida</span>
      </motion.div>

      <motion.h1
        variants={variants}
        className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] tracking-tight text-text-main mb-8"
      >
        {question}
      </motion.h1>

      <motion.div
        variants={variants}
        className="relative inline-block"
      >
        <p className="text-xl md:text-2xl text-text-muted font-serif italic leading-relaxed max-w-2xl mx-auto">
          {answer}
        </p>
        <div className="absolute -top-6 -left-8 text-7xl text-gray-200 opacity-50 font-serif select-none">“</div>
      </motion.div>

      <div className="w-full flex justify-center mt-12 mb-8">
        <span className="inline-block w-24 h-[1px] bg-gray-300"></span>
      </div>
    </header>
  );
};
