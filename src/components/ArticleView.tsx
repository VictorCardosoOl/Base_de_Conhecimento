import React, { useEffect, useState, useCallback, useRef } from 'react';
import { ArrowLeft, ArrowUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { FAQItem } from '../types/index';
import { SEOHead } from './SEOHead';
import { ArticleSkeleton } from './ArticleSkeleton';
import { useArticleContent } from '../hooks/useArticleContent';
import { useRelatedArticles } from '../hooks/useRelatedArticles';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useScrollSpy } from '../hooks/useScrollSpy';

import { ArticleHeader } from './ArticleHeader';
import { ArticleContent } from './ArticleContent';
import { ArticleRelated } from './ArticleRelated';
import { ArticleFooterNav } from './ArticleFooterNav';

interface ArticleViewProps {
  article: FAQItem;
  onBack: () => void;
  onNavigate: (article: FAQItem | null) => void;
  nav: { prev: FAQItem | null; next: FAQItem | null };
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onNavigate, nav }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { htmlContent, isLoading } = useArticleContent(article);
  const relatedArticles = useRelatedArticles(article);
  const { scaleX, showBackToTop, scrollToTop } = useScrollSpy();
  const containerRef = useRef<HTMLDivElement>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleNavAttempt = useCallback((direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? nav.prev : nav.next;
    if (target) {
      onNavigate(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(direction === 'prev'
        ? "Este é o primeiro artigo desta seção."
        : "Você chegou ao último artigo desta seção.");
    }
  }, [nav, onNavigate, showToast]);

  useKeyboardNav(nav, handleNavAttempt);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article.id]);

  useGSAP(() => {
    if (!isLoading && containerRef.current) {
      gsap.fromTo(
        ".gsap-stagger-item",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.8, stagger: 0.1, ease: "power3.out" }
      );
    }
  }, { dependencies: [isLoading, article.id], scope: containerRef });

  return (
    <div className="min-h-screen pb-20 relative" ref={containerRef}>
      <SEOHead
        title={`${article.question} | SST FAQ`}
        description={article.answer.substring(0, 150)}
        isArticle={true}
      />

      <div
        className="fixed bottom-0 left-0 right-0 h-[3px] bg-black origin-left z-50 transition-transform duration-100 ease-out"
        style={{ transform: `scaleX(${scaleX})` }}
      />

      <nav className="sticky top-0 z-10 w-full bg-bg-island/80 backdrop-blur-md border-b border-border mb-12 no-print transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium text-text-muted">
            <button
              onClick={onBack}
              className="hover:text-blue-600 transition-colors flex items-center gap-1"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <span className="text-gray-300">|</span>
            <Link to="/" className="hover:text-blue-600 transition-colors">Início</Link>
            <ChevronRight size={12} className="text-gray-400" />
            <span className="uppercase tracking-wide opacity-80">{article.category}</span>
            <ChevronRight size={12} className="text-gray-400 hidden sm:block" />
            <span className="font-semibold text-text-main truncate max-w-[150px] sm:max-w-xs hidden sm:block">
              {article.question}
            </span>
          </div>
        </div>
      </nav>

      {isLoading ? (
        <ArticleSkeleton />
      ) : (
        <div className="max-w-6xl mx-auto px-6">
          <ArticleHeader
            category={article.category}
            question={article.question}
            answer={article.answer}
          />

          <ArticleContent
            htmlContent={htmlContent}
          />

          <ArticleRelated
            relatedArticles={relatedArticles}
            onNavigate={onNavigate}
          />

          <ArticleFooterNav
            nav={nav}
            onNavigateAttempt={handleNavAttempt}
          />

          {toastMessage && (
            <div className="sticky bottom-12 z-[100] flex justify-center w-full pointer-events-none">
              <div className="pointer-events-auto px-8 py-3 bg-black/90 backdrop-blur-sm text-white rounded-full shadow-2xl border border-white/10 animate-fade-in-up">
                <p className="font-serif italic text-lg md:text-xl leading-snug whitespace-nowrap">
                  {toastMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 p-3 bg-white border border-gray-200 shadow-lg rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all duration-300 animate-fade-in-up"
          title="Voltar ao topo"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};
