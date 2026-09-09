import React from 'react';

interface ArticleHeaderProps {
  category: string;
  question: string;
  answer: string;
}

export const ArticleHeader: React.FC<ArticleHeaderProps> = ({ category, question, answer }) => {
  return (
    <header className="gsap-stagger-item mb-20 md:mb-28 text-center max-w-4xl mx-auto">
      <div className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-accent mb-6">
        <span>{category}</span>
        <span className="w-1 h-1 rounded-full bg-current opacity-40" />
        <span>Leitura Rápida</span>
      </div>

      <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] tracking-tight text-text-main mb-8">
        {question}
      </h1>

      <div className="relative inline-block">
        <p className="text-xl md:text-2xl text-text-muted font-serif italic leading-relaxed max-w-2xl mx-auto">
          {answer}
        </p>
        <div className="absolute -top-6 -left-8 text-7xl text-text-muted opacity-20 font-serif select-none">“</div>
      </div>

      <div className="w-full flex justify-center mt-12 mb-8">
        <span className="inline-block w-24 h-[1px] bg-border"></span>
      </div>
    </header>
  );
};
