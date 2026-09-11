import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ArticleLightboxProps {
  src: string | null;
  alt?: string;
  onClose: () => void;
}

export const ArticleLightbox: React.FC<ArticleLightboxProps> = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (!src) return;
    setScale(1);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [src, onClose]);

  if (!src) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/90 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8"
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
              onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
              aria-label="Diminuir Zoom"
              className="p-2 rounded-lg bg-stone-900/80 hover:bg-stone-800 text-stone-200 border border-stone-700 transition-colors"
            >
              <ZoomOut size={16} />
            </button>
            <span className="text-[11px] font-mono text-stone-300 w-12 text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={() => setScale(s => Math.min(3, s + 0.25))}
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
          <motion.img
            src={src}
            alt={alt || 'Imagem ampliada'}
            style={{ transform: `scale(${scale})`, transition: 'transform 0.2s ease-out' }}
            className="max-h-[85vh] max-w-[90vw] object-contain cursor-grab active:cursor-grabbing rounded shadow-2xl select-none"
          />
        </div>

        {/* Rodapé informativo */}
        <div className="text-[11px] text-stone-400 font-serif italic text-center z-10">
          Pressione Esc ou clique fora para retornar ao artigo
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
