import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ArrowUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    exit: { opacity: 0 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="min-h-screen pb-20 relative">
      <SEOHead
        title={`${article.question} | SST FAQ`}
        description={article.answer.substring(0, 150)}
        isArticle={true}
      />

      <motion.div
        className="fixed bottom-0 left-0 right-0 h-[3px] bg-black origin-left z-50"
        style={{ scaleX }}
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
        <AnimatePresence mode="wait">
          <motion.div
            key={article.id}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-6xl mx-auto px-6"
          >
            <ArticleHeader
              category={article.category}
              question={article.question}
              answer={article.answer}
              variants={itemVariants}
            />

            <ArticleContent
              htmlContent={htmlContent}
              variants={itemVariants}
            />

            <ArticleRelated
              relatedArticles={relatedArticles}
              onNavigate={onNavigate}
              variants={itemVariants}
            />

            <ArticleFooterNav
              nav={nav}
              onNavigateAttempt={handleNavAttempt}
              variants={itemVariants}
            />

            <AnimatePresence>
              {toastMessage && (
                <div className="sticky bottom-12 z-[100] flex justify-center w-full pointer-events-none">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="pointer-events-auto px-8 py-3 bg-black/90 backdrop-blur-sm text-white rounded-full shadow-2xl border border-white/10"
                  >
                    <p className="font-serif italic text-lg md:text-xl leading-snug whitespace-nowrap">
                      {toastMessage}
                    </p>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      )}

      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            onClick={scrollToTop}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-8 z-40 p-3 bg-white border border-gray-200 shadow-lg rounded-full text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all duration-300"
            title="Voltar ao topo"
          >
            <ArrowUp size={20} />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
