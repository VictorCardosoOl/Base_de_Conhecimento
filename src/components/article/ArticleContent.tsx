"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { ArticleLightbox } from './ArticleLightbox';
import { ArticleHighlightsToolbar } from './ArticleHighlightsToolbar';
import { ReadingExperienceService, HighlightItem } from '../../services/reading-experience-service';

interface ArticleContentProps {
  htmlContent: string;
  articleId?: string;
  typography?: any;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({ htmlContent, articleId, typography: propTypography }) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>('');
  const [typography, setTypography] = useState<any>(propTypography || null);
  const [activeHighlights, setActiveHighlights] = useState<HighlightItem[]>([]);

  useEffect(() => {
    setTypography(ReadingExperienceService.getTypography());
    if (articleId) {
      setActiveHighlights(ReadingExperienceService.getHighlights(articleId));
    }

    const handleSettingsUpdate = () => {
      setTypography(ReadingExperienceService.getTypography());
    };
    
    const handleHighlightsUpdate = (e: any) => {
      if (articleId && e.detail?.articleId === articleId) {
        setActiveHighlights(ReadingExperienceService.getHighlights(articleId));
      }
    };

    window.addEventListener('sst_reading_settings_updated', handleSettingsUpdate);
    window.addEventListener('sst_highlights_updated', handleHighlightsUpdate);
    
    return () => {
      window.removeEventListener('sst_reading_settings_updated', handleSettingsUpdate);
      window.removeEventListener('sst_highlights_updated', handleHighlightsUpdate);
    };
  }, [articleId]);

  const handleCloseLightbox = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  useEffect(() => {
    if (!htmlContent) return;
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.documentElement.classList.contains('dark') ? 'dark' : 'default',
        securityLevel: 'loose',
      });
      mermaid.run({
        nodes: document.querySelectorAll('.language-mermaid'),
      }).catch(() => {});
    } catch (e) {}
  }, [htmlContent]);

  useEffect(() => {
    if (!contentRef.current) return;
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.add('cursor-zoom-in', 'transition-transform', 'hover:opacity-90');
      const handleClick = () => {
        setLightboxSrc(img.getAttribute('src'));
        setLightboxAlt(img.getAttribute('alt') || 'Imagem do Artigo');
      };
      img.addEventListener('click', handleClick);
    });
  }, [htmlContent]);

  const processedHtml = React.useMemo(() => {
    if (!htmlContent) return '';
    let res = htmlContent;
    if (activeHighlights.length > 0) {
      activeHighlights.forEach(h => {
        if (!h.text) return;
        const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const safeColor = ['amber', 'emerald', 'sky', 'rose'].includes(h.color) ? h.color : 'amber';
        const regex = new RegExp(`(?![^<]*>)(${escaped})`, 'gi');
        res = res.replace(regex, `<mark class="sst-highlight-${safeColor}">$1</mark>`);
      });
    }

    if (typeof window === 'undefined') return res;
    
    return DOMPurify.sanitize(res, {
      ADD_TAGS: ['mark'],
      ADD_ATTR: ['class', 'data-tooltip']
    });
  }, [htmlContent, activeHighlights]);

  const typoClasses = [
    typography?.fontFamily === 'sans' ? 'article-font-sans' : typography?.fontFamily === 'dyslexic' ? 'article-font-dyslexic' : 'article-font-serif',
    `article-size-${typography?.fontSize || 'base'}`,
    `article-leading-${typography?.lineHeight || 'relaxed'}`
  ].join(' ');

  return (
    <div className="relative">
      <div
        ref={contentRef}
        className={`gsap-stagger-item article-content-render max-w-4xl mx-auto ${typoClasses}`}
        dangerouslySetInnerHTML={{ __html: processedHtml }}
      />
      {articleId && (
        <ArticleHighlightsToolbar articleId={articleId} containerRef={contentRef} />
      )}
      <ArticleLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={handleCloseLightbox}
      />
    </div>
  );
};
