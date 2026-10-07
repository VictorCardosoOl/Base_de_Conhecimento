'use client';
import React, { useEffect, useRef, useState, useCallback } from 'react';

import DOMPurify from 'dompurify';
import { ArticleLightbox } from './ArticleLightbox';
import { ArticleHighlightsToolbar } from './ArticleHighlightsToolbar';
import {
  ReadingExperienceService,
  HighlightItem,
  TypographyPreferences,
} from '../../services/reading-experience-service';

interface ArticleContentProps {
  htmlContent: string;
  articleId?: string;
  typography?: TypographyPreferences;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  htmlContent,
  articleId,
  typography: propTypography,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>('');
  const [typography, setTypography] = useState<TypographyPreferences | null>(propTypography || null);
  const [activeHighlights, setActiveHighlights] = useState<HighlightItem[]>([]);

  useEffect(() => {
    setTypography(ReadingExperienceService.getTypography());
    if (articleId) {
      setActiveHighlights(ReadingExperienceService.getHighlights(articleId));
    }

    const handleSettingsUpdate = () => {
      setTypography(ReadingExperienceService.getTypography());
    };

    const handleHighlightsUpdate = (e: Event) => {
      const evt = e as CustomEvent<{ articleId: string }>;
      if (articleId && evt.detail?.articleId === articleId) {
        setActiveHighlights(ReadingExperienceService.getHighlights(articleId));
      }
    };

    window.addEventListener(
      'sst_reading_settings_updated',
      handleSettingsUpdate
    );
    window.addEventListener('sst_highlights_updated', handleHighlightsUpdate);

    return () => {
      window.removeEventListener(
        'sst_reading_settings_updated',
        handleSettingsUpdate
      );
      window.removeEventListener(
        'sst_highlights_updated',
        handleHighlightsUpdate
      );
    };
  }, [articleId]);

  const handleCloseLightbox = useCallback(() => {
    setLightboxSrc(null);
  }, []);

  useEffect(() => {
    if (!htmlContent || !htmlContent.includes('language-mermaid')) return;
    
    const initMermaid = async () => {
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        
        mermaid.initialize({
          startOnLoad: false,
          theme: document.documentElement.classList.contains('dark')
            ? 'dark'
            : 'default',
          securityLevel: 'loose',
        });
        
        const nodes = document.querySelectorAll<HTMLElement>('.language-mermaid');
        if (nodes.length > 0) {
          await mermaid.run({ nodes: Array.from(nodes) });
        }
      } catch (e) {
        console.error('Mermaid init error:', e);
      }
    };
    
    // Pequeno atraso para garantir que o DOMPurify e o React renderizaram o HTML primeiro
    const timer = setTimeout(() => {
      initMermaid();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [htmlContent]);

  useEffect(() => {
    if (!contentRef.current) return;
    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.add(
        'cursor-zoom-in',
        'transition-transform',
        'hover:opacity-90'
      );
    });
  }, [htmlContent]);

  const handleContentClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG') {
      setLightboxSrc(target.getAttribute('src'));
      setLightboxAlt(target.getAttribute('alt') || 'Imagem do Artigo');
    }
  }, []);

  const processedHtml = React.useMemo(() => {
    if (!htmlContent) return '';
    if (!isMounted) return ''; // Previne injeção de HTML sujo no servidor e erros de hidratação

    // Sanitização inicial segura
    let safeHtml = DOMPurify.sanitize(htmlContent, {
      ADD_TAGS: ['mark'],
      ADD_ATTR: ['class', 'data-tooltip'],
    });

    if (activeHighlights.length > 0) {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(safeHtml, 'text/html');
        const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);
        
        const nodesToReplace: {node: Text, newNodes: Node[]}[] = [];
        
        let node;
        while (node = walker.nextNode()) {
          const text = node.nodeValue;
          if (!text || text.trim() === '') continue;
          
          let newHtml = text;
          let matchFound = false;
          
          activeHighlights.forEach(h => {
            if (!h.text) return;
            const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const safeColor = ['amber', 'emerald', 'sky', 'rose'].includes(h.color) ? h.color : 'amber';
            
            // Seguro: aplicado apenas sobre TextNodes, não corrompe HTML e sem Lookaheads perigosos
            const regex = new RegExp(`(${escaped})`, 'gi');
            if (regex.test(newHtml)) {
                matchFound = true;
                newHtml = newHtml.replace(regex, `<mark class="sst-highlight-${safeColor}">$1</mark>`);
            }
          });
          
          if (matchFound) {
            const temp = document.createElement('div');
            temp.innerHTML = newHtml;
            nodesToReplace.push({node: node as Text, newNodes: Array.from(temp.childNodes)});
          }
        }
        
        nodesToReplace.forEach(({node, newNodes}) => {
          const parent = node.parentNode;
          if (parent) {
            newNodes.forEach(n => parent.insertBefore(n, node));
            parent.removeChild(node);
          }
        });
        
        safeHtml = doc.body.innerHTML;
      } catch(e) {
        console.error('Error applying highlights to HTML:', e);
      }
    }

    return safeHtml;
  }, [htmlContent, activeHighlights, isMounted]);

  const typoClasses = [
    typography?.fontFamily === 'sans'
      ? 'article-font-sans'
      : typography?.fontFamily === 'dyslexic'
        ? 'article-font-dyslexic'
        : 'article-font-serif',
    `article-size-${typography?.fontSize || 'base'}`,
    `article-leading-${typography?.lineHeight || 'relaxed'}`,
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
