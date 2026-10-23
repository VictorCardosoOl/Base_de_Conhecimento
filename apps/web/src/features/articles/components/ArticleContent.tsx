'use client';
import React, { useEffect, useRef, useState, useCallback, useSyncExternalStore } from 'react';
import { ArticleLightbox } from './ArticleLightbox';
import { ArticleHighlightsToolbar } from './ArticleHighlightsToolbar';
import { useMermaidRenderer } from '../hooks/use-mermaid-renderer';
import { useTextHighlighter } from '../hooks/use-text-highlighter';
import {
  READING_EVENTS,
  ReadingExperienceService,
  type HighlightItem,
  type TypographyPreferences,
} from '@/features/reading/reading-experience-service';

interface ArticleContentProps {
  htmlContent: string;
  articleId?: string;
  typography?: TypographyPreferences;
}

const emptySubscribe = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

export const ArticleContent: React.FC<ArticleContentProps> = ({
  htmlContent,
  articleId,
  typography: propTypography,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isMounted = useSyncExternalStore(emptySubscribe, getClientMounted, getServerMounted);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>('');
  const [typography, setTypography] = useState<TypographyPreferences | null>(
    () => propTypography || (typeof window !== 'undefined' ? ReadingExperienceService.getTypography() : null)
  );
  const [activeHighlights, setActiveHighlights] = useState<HighlightItem[]>(
    () => (articleId && typeof window !== 'undefined' ? ReadingExperienceService.getHighlights(articleId) : [])
  );

  // Sincronização de preferências de leitura e destaques
  useEffect(() => {
    const handleSettingsUpdate = () => {
      setTypography(ReadingExperienceService.getTypography());
    };

    const handleHighlightsUpdate = (e: Event) => {
      const evt = e as CustomEvent<{ articleId?: string }>;
      if (articleId && (!evt.detail?.articleId || evt.detail.articleId === articleId)) {
        setActiveHighlights(ReadingExperienceService.getHighlights(articleId));
      }
    };

    window.addEventListener(READING_EVENTS.typographyUpdated, handleSettingsUpdate);
    window.addEventListener(READING_EVENTS.highlightsUpdated, handleHighlightsUpdate);

    return () => {
      window.removeEventListener(READING_EVENTS.typographyUpdated, handleSettingsUpdate);
      window.removeEventListener(READING_EVENTS.highlightsUpdated, handleHighlightsUpdate);
    };
  }, [articleId]);

  // Hooks especializados
  useMermaidRenderer(htmlContent);
  const processedHtml = useTextHighlighter(htmlContent, activeHighlights, isMounted);

  const handleCloseLightbox = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  useEffect(() => {
    if (!contentRef.current) return;
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.add('cursor-zoom-in', 'transition-transform', 'hover:opacity-90');
    });
  }, [htmlContent]);

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setLightboxSrc(target.getAttribute('src'));
      setLightboxAlt(target.getAttribute('alt') || 'Imagem do Artigo');
    }
  }, []);

  const activeTypo = propTypography || typography;
  const typoClasses = [
    activeTypo?.fontFamily === 'sans'
      ? 'article-font-sans'
      : activeTypo?.fontFamily === 'dyslexic'
        ? 'article-font-dyslexic'
        : 'article-font-serif',
    `article-size-${activeTypo?.fontSize || 'base'}`,
    `article-leading-${activeTypo?.lineHeight || 'relaxed'}`,
  ].join(' ');

  return (
    <div className="relative">
      <div
        ref={contentRef}
        onClick={handleContentClick}
        className={`gsap-stagger-item article-content-render max-w-4xl mx-auto ${typoClasses}`}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
      {articleId && (
        <ArticleHighlightsToolbar
          articleId={articleId}
          containerRef={contentRef}
        />
      )}
      <ArticleLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={handleCloseLightbox}
      />
    </div>
  );
};
