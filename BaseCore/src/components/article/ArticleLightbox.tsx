'use client';
import React, { useEffect, useState, useRef } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface ArticleLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export const ArticleLightbox: React.FC<ArticleLightboxProps> = ({
  src,
  alt,
  onClose,
}) => {
  const [scale, setScale] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [shouldClose, setShouldClose] = useState(false);

  useEffect(() => {
    if (src) {
      setMounted(true);
      setShouldClose(false);
    } else {
      setShouldClose(true);
    }
  }, [src]);

  useGSAP(() => {
    if (mounted && !shouldClose && containerRef.current) {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' });
    } else if (mounted && shouldClose && containerRef.current) {
      gsap.to(containerRef.current, {
        opacity: 0,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => {
          setMounted(false);
        }
      });
    }
  }, [mounted, shouldClose]);

  useEffect(() => {
    if (!mounted) return;
    setScale(1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mounted, onClose]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[120] bg-black/95 flex flex-col items-center justify-between p-4 sm:p-8 will-change-[opacity]"
      onClick={onClose}
    >
      {/* Barra Superior */}
      <div
        className="w-full max-w-5xl flex items-center justify-between z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs font-mono uppercase tracking-widest text-stone-400 truncate max-w-md">
          {alt || 'Visualização Detalhada'}
        </span>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, s - 0.25))}
            aria-label="Diminuir Zoom"
            className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
          >
            <ZoomOut size={16} />
          </button>
          <span className="text-[11px] font-mono text-stone-300 w-12 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(3, s + 0.25))}
            aria-label="Aumentar Zoom"
            className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
          >
            <ZoomIn size={16} />
          </button>
          <button
            onClick={() => setScale(1)}
            aria-label="Redefinir Zoom"
            className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onClose}
            aria-label="Fechar Lightbox"
            className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors ml-2"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Imagem Central com Zoom */}
      <div
        className="flex-1 w-full flex items-center justify-center overflow-auto p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {src && (
          <img
            src={src}
            alt={alt || 'Imagem ampliada'}
            style={{
              transform: `scale(${scale})`,
              transition: 'transform 0.2s ease-out',
            }}
            className="max-h-[85vh] max-w-[90vw] object-contain cursor-grab active:cursor-grabbing rounded shadow-2xl select-none"
          />
        )}
      </div>

      {/* Rodapé informativo */}
      <div className="text-[11px] text-stone-400 font-serif italic text-center z-10">
        Pressione Esc ou clique fora para retornar ao artigo
      </div>
    </div>
  );
};
