import React, { useMemo, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ChevronRight } from 'lucide-react';
import { marked } from 'marked';
import { Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { FAQItem } from '../types';
import { SEOHead } from './SEOHead';
import { ArticleSkeleton } from './ArticleSkeleton';
import { FAQ_DATA } from '../constants';
import glossaryData from '../data/glossary.json';

interface ArticleViewProps {
  article: FAQItem;
  onBack: () => void;
  onNavigate: (article: FAQItem | null) => void;
  nav: { prev: FAQItem | null; next: FAQItem | null };
}

export const ArticleView: React.FC<ArticleViewProps> = ({ article, onBack, onNavigate, nav }) => {
  const [content, setContent] = useState<string | React.ComponentType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleNavAttempt = (direction: 'prev' | 'next') => {
    const target = direction === 'prev' ? nav.prev : nav.next;
    if (target) {
      onNavigate(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      showToast(direction === 'prev'
        ? "Este é o primeiro artigo desta seção."
        : "Você chegou ao último artigo desta seção.");
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Scroll listener for Back to Top
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        handleNavAttempt('prev');
      } else if (e.key === 'ArrowRight') {
        handleNavAttempt('next');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nav, onNavigate]);

  // Scroll to top when article changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [article.id]);

  useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const loadContent = async () => {
      try {
        if (typeof article.content === 'function') {
          const module = await article.content();
          const rawContent = module.default.content;
          if (mounted) setContent(() => rawContent);
        } else {
          if (mounted) setContent(article.content || article.answer);
        }
      } catch (err) {
        console.error("Failed to load article content", err);
        if (mounted) setContent(article.answer);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadContent();
    return () => { mounted = false; };
  }, [article]);

  const htmlContent = useMemo(() => {
    if (!content || typeof content !== 'string') return '';

    // Parse Markdown
    const rawHtml = marked.parse(content) as string;
    let sanitizedHtml = DOMPurify.sanitize(rawHtml);

    // Inject Glossary Tooltips
    // Case insensitive matching ('gi')
    Object.entries(glossaryData).forEach(([term, definition]) => {
      const regex = new RegExp(`\\b(${term})\\b`, 'gi');
      sanitizedHtml = sanitizedHtml.replace(regex, (match) =>
        `<span class="glossary-term" data-tooltip="${definition}">${match}</span>`
      );
    });

    return sanitizedHtml;
  }, [content]);

  const relatedArticles = useMemo(() => {
    if (!article.tags || article.tags.length === 0) return [];

    return FAQ_DATA
      .filter(item => item.id !== article.id)
      .map(item => ({
        item,
        score: item.tags.filter(tag => article.tags.includes(tag)).length
      }))
      .filter(match => match.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(match => match.item);
  }, [article]);

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
      />

      {/* Reading Progress Bar (Discrete Bottom) */}
      <motion.div
        className="fixed bottom-0 left-0 right-0 h-[3px] bg-black origin-left z-50"
        style={{ scaleX }}
      />

      {/* Navigation Top (Smart Breadcrumbs) */}
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
            {/* Editorial Header */}
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

              {/* Decorative Divider */}
              <div className="w-full flex justify-center mt-12 mb-8">
                <span className="inline-block w-24 h-[1px] bg-gray-300"></span>
              </div>
            </header>

            {/* Main Content */}
            <motion.div
              variants={itemVariants}
              className="article-content-render prose prose-lg prose-slate max-w-none
                prose-headings:font-serif prose-headings:font-medium prose-headings:tracking-tight prose-headings:text-gray-900
                prose-p:leading-8 prose-p:text-gray-600 prose-p:font-light
                prose-strong:font-semibold prose-strong:text-gray-800
                prose-blockquote:border-l-2 prose-blockquote:border-blue-500 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-gray-700
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-li:marker:text-gray-400 prose-img:rounded-lg prose-img:shadow-sm
                
                /* Drop Cap Styling */
                first-letter:float-left first-letter:text-[4.5rem] first-letter:leading-[0.8] first-letter:font-serif first-letter:mr-3 first-letter:text-gray-900 first-letter:font-medium"
            >
              {typeof content === 'string' ? (
                <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
              ) : (
                content && React.createElement(content as React.ComponentType)
              )}
            </motion.div>

            {/* Related Articles */}
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

            {/* Footer Navigation (Hybrid logic: Link if active, Button calls toast if inactive) */}
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

            {/* Discrete Toast Notification (Sticky Content-Aligned & Elegant) */}
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

      {/* Back to Top Button */}
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