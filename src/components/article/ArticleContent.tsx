import React, { useEffect, useRef, useState, useCallback } from 'react';
import mermaid from 'mermaid';
import DOMPurify from 'dompurify';
import { ArticleLightbox } from './ArticleLightbox';
import { ArticleHighlightsToolbar } from './ArticleHighlightsToolbar';
import { ReadingExperienceService, TypographyPreferences, HighlightItem } from '../../services/readingExperienceService';
import { Check, Copy } from 'lucide-react';

interface ArticleContentProps {
  htmlContent: string;
  articleId?: string;
  typography?: TypographyPreferences;
}

export const ArticleContent: React.FC<ArticleContentProps> = ({
  htmlContent,
  articleId = '',
  typography
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [lightboxAlt, setLightboxAlt] = useState<string>('');
  const activeBlobUrlRef = useRef<string | null>(null);
  const [activeHighlights, setActiveHighlights] = useState<HighlightItem[]>(() => 
    articleId ? ReadingExperienceService.getHighlights(articleId) : []
  );

  const handleCloseLightbox = useCallback(() => {
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setLightboxSrc(null);
  }, []);

  // Cleanup de blob URL em unmount
  useEffect(() => {
    return () => {
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, []);

  // 1. Escutar atualizações de destaques
  useEffect(() => {
    const handleHighlightsUpdate = () => {
      if (articleId) {
        setActiveHighlights(ReadingExperienceService.getHighlights(articleId));
      }
    };
    window.addEventListener('sst_highlights_updated', handleHighlightsUpdate);
    return () => window.removeEventListener('sst_highlights_updated', handleHighlightsUpdate);
  }, [articleId]);

  // 2. Inicializar Mermaid.js nos diagramas do artigo com sanitização de SVG
  useEffect(() => {
    if (!contentRef.current) return;

    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: document.body.classList.contains('dark') ? 'dark' : 'neutral',
        securityLevel: 'strict',
        fontFamily: 'var(--font-sans)',
      });

      // Procurar blocos de código com linguagem mermaid
      const mermaidBlocks = contentRef.current.querySelectorAll('pre code.language-mermaid, pre.mermaid');
      mermaidBlocks.forEach((block, index) => {
        const pre = block.closest('pre');
        if (!pre) return;
        const code = block.textContent || '';
        const id = `mermaid-chart-${index}-${Date.now()}`;
        
        const wrapper = document.createElement('div');
        wrapper.className = 'mermaid-wrapper my-6 cursor-zoom-in';
        wrapper.id = id;

        mermaid.render(id + '-svg', code).then(({ svg }) => {
          // Sanitização explícita do SVG para prevenir SVG-based DOM XSS
          const safeSvg = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } });
          wrapper.innerHTML = safeSvg;
          pre.replaceWith(wrapper);
          wrapper.addEventListener('click', () => {
            if (activeBlobUrlRef.current) {
              URL.revokeObjectURL(activeBlobUrlRef.current);
            }
            const svgBlob = new Blob([safeSvg], { type: 'image/svg+xml;charset=utf-8' });
            const URLObj = window.URL || window.webkitURL;
            const blobUrl = URLObj.createObjectURL(svgBlob);
            activeBlobUrlRef.current = blobUrl;
            setLightboxSrc(blobUrl);
            setLightboxAlt('Diagrama de Fluxo Mermaid');
          });
        }).catch((err) => {
          console.warn('Falha ao renderizar diagrama Mermaid:', err);
        });
      });
    } catch (e) {
      console.warn('Erro ao inicializar Mermaid:', e);
    }
  }, [htmlContent]);

  // 3. Injetar botão "Copiar" nos blocos de código
  useEffect(() => {
    if (!contentRef.current) return;

    const codeBlocks = contentRef.current.querySelectorAll('pre');
    codeBlocks.forEach((pre) => {
      if (pre.querySelector('.code-copy-btn') || pre.classList.contains('mermaid')) return;

      const button = document.createElement('button');
      button.className = 'code-copy-btn absolute top-2 right-2 px-2 py-1 text-[11px] font-mono rounded bg-stone-200/80 dark:bg-stone-800/80 hover:bg-stone-300 dark:hover:bg-stone-700 text-text-muted hover:text-text-main transition-colors flex items-center gap-1 opacity-0 group-hover:opacity-100';
      button.innerHTML = '<span>Copiar</span>';
      
      pre.classList.add('group', 'relative');
      pre.appendChild(button);

      button.addEventListener('click', async () => {
        const code = pre.querySelector('code')?.innerText || pre.innerText || '';
        try {
          await navigator.clipboard.writeText(code);
          button.innerHTML = '<span class="text-emerald-600 font-semibold">Copiado!</span>';
          setTimeout(() => {
            button.innerHTML = '<span>Copiar</span>';
          }, 2000);
        } catch {
          button.innerHTML = '<span class="text-red-500">Falha</span>';
        }
      });
    });
  }, [htmlContent]);

  // 4. Click em imagens para Lightbox
  useEffect(() => {
    if (!contentRef.current) return;

    const images = contentRef.current.querySelectorAll('img');
    images.forEach((img) => {
      img.classList.add('cursor-zoom-in', 'transition-transform', 'hover:opacity-95');
      const handleClick = () => {
        setLightboxSrc(img.getAttribute('src'));
        setLightboxAlt(img.getAttribute('alt') || 'Imagem do Artigo');
      };
      img.addEventListener('click', handleClick);
    });
  }, [htmlContent]);

  // Injetar marcações (Highlights) no HTML e re-sanitizar após manipulação
  const processedHtml = React.useMemo(() => {
    if (!htmlContent) return '';
    if (activeHighlights.length === 0) return htmlContent;

    let res = htmlContent;
    activeHighlights.forEach(h => {
      if (!h.text) return;
      const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const safeColor = ['amber', 'emerald', 'sky', 'rose'].includes(h.color) ? h.color : 'amber';
      const regex = new RegExp(`(?![^<]*>)(${escaped})`, 'gi');
      res = res.replace(regex, `<mark class="sst-highlight-${safeColor}">$1</mark>`);
    });

    // Sanitiza novamente após a injeção dos elementos <mark> permitindo classes seguras
    return DOMPurify.sanitize(res, {
      ADD_TAGS: ['mark'],
      ADD_ATTR: ['class', 'data-tooltip']
    });
  }, [htmlContent, activeHighlights]);

  // Classes tipográficas dinâmicas
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

      {/* Toolbar Flutuante de Marcações de Texto */}
      {articleId && (
        <ArticleHighlightsToolbar articleId={articleId} containerRef={contentRef} />
      )}

      {/* Lightbox Fullscreen */}
      <ArticleLightbox
        src={lightboxSrc}
        alt={lightboxAlt}
        onClose={handleCloseLightbox}
      />
    </div>
  );
};

