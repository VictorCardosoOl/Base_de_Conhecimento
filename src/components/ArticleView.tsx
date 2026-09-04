import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FAQItem } from '../types';
import { SEOHead } from './SEOHead';
import { ArticleSkeleton } from './ArticleSkeleton';
import { useArticleContent } from '../hooks/useArticleContent';
import { useRelatedArticles } from '../hooks/useRelatedArticles';
import { useKeyboardNav } from '../hooks/useKeyboardNav';
import { useScrollSpy } from '../hooks/useScrollSpy';

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

      <nav className="sticky top-0 z-10 w-full bg-[var(--bg-island)]/80 backdrop-blur-md border-b border-[var(--border)] mb-12 no-print transition-all duration-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs font-medium text-[var(--text-muted)]">
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
            <span className="font-semibold text-[var(--text-main)] truncate max-w-[150px] sm:max-w-xs hidden sm:block">
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
            <header className="mb-20 md:mb-28 text-center max-w-4xl mx-auto">
              <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[var(--accent)] mb-6">
                <span>{article.category}</span>
                <span className="w-1 h-1 rounded-full bg-current opacity-40" />
                <span>Leitura Rápida</span>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-4xl md:text-6xl lg:text-7xl font-serif font-medium leading-[1.1] tracking-tight text-[var(--text-main)] mb-8"
              >
                {article.question}
              </motion.h1>

              <motion.div
                variants={itemVariants}
                className="relative inline-block"
              >
                <p className="text-xl md:text-2xl text-[var(--text-muted)] font-serif italic leading-relaxed max-w-2xl mx-auto">
                  {article.answer}
                </p>
                <div className="absolute -top-6 -left-8 text-7xl text-gray-200 opacity-50 font-serif select-none">“</div>
              </motion.div>

              <div className="w-full flex justify-center mt-12 mb-8">
                <span className="inline-block w-24 h-[1px] bg-gray-300"></span>
              </div>
            </header>

            <motion.div
              variants={itemVariants}
              className="article-content-render prose prose-lg prose-slate max-w-none
                prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-gray-900
                prose-p:leading-8 prose-p:text-gray-600 prose-p:font-light
                prose-strong:font-semibold prose-strong:text-gray-800
                prose-blockquote:border-l-2 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-li:marker:text-gray-400 prose-img:rounded-lg prose-img:shadow-sm
                first-letter:float-left first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-serif first-letter:mr-3 first-letter:text-gray-900 first-letter:font-medium"
            >
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </motion.div>

            {relatedArticles.length > 0 && (
              <motion.div variants={itemVariants} className="mt-24 pt-12 border-t border-[var(--border)] no-print">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-8">Veja também</h3>
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
            )}

            <motion.footer
              variants={itemVariants}
              className="mt-16 pt-12 border-t border-[var(--border)] grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 no-print"
            >
              <div
                onClick={() => handleNavAttempt('prev')}
                className={`group text-left space-y-3 p-6 -ml-6 rounded-2xl transition-all duration-300 block w-full cursor-pointer ${!nav.prev ? 'opacity-40 grayscale hover:bg-transparent cursor-not-allowed' : 'hover:bg-[var(--bg-island)]'}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors flex items-center gap-2">
                  <ArrowLeft size={14} className={nav.prev ? "group-hover:-translate-x-1 transition-transform" : ""} />
                  Anterior
                </span>
                <h4 className="text-xl font-serif text-[var(--text-main)] leading-tight group-hover:underline decoration-1 underline-offset-4">
                  {nav.prev ? nav.prev.question : "Início do Módulo"}
                </h4>
              </div>

              <div
                onClick={() => handleNavAttempt('next')}
                className={`group text-right md:text-right space-y-3 p-6 -mr-6 rounded-2xl transition-all duration-300 block w-full flex flex-col items-end cursor-pointer ${!nav.next ? 'opacity-40 grayscale hover:bg-transparent cursor-not-allowed' : 'hover:bg-[var(--bg-island)]'}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors flex items-center gap-2 justify-end">
                  Próximo
                  <ArrowRight size={14} className={nav.next ? "group-hover:translate-x-1 transition-transform" : ""} />
                </span>
                <h4 className="text-xl font-serif text-[var(--text-main)] leading-tight group-hover:underline decoration-1 underline-offset-4">
                  {nav.next ? nav.next.question : "Final do Módulo"}
                </h4>
              </div>
            </motion.footer>

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