import React, { useState, useRef, useEffect } from 'react';
import { Type, Eye, EyeOff, Check, SlidersHorizontal } from 'lucide-react';
import { ReadingExperienceService, TypographyPreferences } from '../../services/readingExperienceService';

interface ArticleReadingControlsProps {
  isZenMode: boolean;
  onToggleZenMode: () => void;
  onTypographyChange?: (pref: TypographyPreferences) => void;
}

export const ArticleReadingControls: React.FC<ArticleReadingControlsProps> = ({
  isZenMode,
  onToggleZenMode,
  onTypographyChange
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [pref, setPref] = useState<TypographyPreferences>(() => ReadingExperienceService.getTypography());
  const popoverRef = useRef<HTMLDivElement>(null);

  const updatePreference = (newPref: Partial<TypographyPreferences>) => {
    const updated = { ...pref, ...newPref };
    setPref(updated);
    ReadingExperienceService.setTypography(updated);
    if (onTypographyChange) onTypographyChange(updated);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-flex items-center gap-1.5" ref={popoverRef}>
      {/* Botão Modo Foco (Zen Mode) */}
      <button
        onClick={onToggleZenMode}
        title={isZenMode ? "Sair do Modo Foco" : "Modo Foco (Zen Mode - Sem Distrações)"}
        aria-label={isZenMode ? "Sair do Modo Foco" : "Ativar Modo Foco"}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
          isZenMode 
            ? 'bg-text-main text-bg-main border-text-main shadow-sm' 
            : 'border-border text-text-muted hover:text-text-main hover:bg-stone-100 dark:hover:bg-stone-800'
        }`}
      >
        {isZenMode ? <EyeOff size={14} /> : <Eye size={14} />}
        <span className="hidden sm:inline">{isZenMode ? 'Foco Ativo' : 'Modo Foco'}</span>
      </button>

      {/* Botão de Personalização Tipográfica */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Ajuste a leitura para sua preferência visual"
        aria-label="Ajustar Tipografia e Leitura"
        className={`p-2 rounded-lg border border-border text-text-muted hover:text-text-main hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors ${
          isOpen ? 'bg-stone-100 dark:bg-stone-800 text-text-main' : ''
        }`}
      >
        <SlidersHorizontal size={14} />
      </button>

      {/* Popover Editorial de Configurações */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 p-4 bg-bg-island backdrop-blur-xl border border-border shadow-2xl rounded-xl z-50 animate-fade-in-up space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
              Tipografia & Leitura
            </span>
            <Type size={13} className="text-text-muted" />
          </div>

          {/* 1. Tamanho da Fonte */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted block">Tamanho do Texto</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-stone-900/60 rounded-lg border border-border">
              {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePreference({ fontSize: size })}
                  className={`py-1 text-xs font-mono font-bold rounded transition-all ${
                    pref.fontSize === size
                      ? 'bg-bg-main text-text-main shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {size === 'sm' ? 'A-' : size === 'base' ? 'A' : size === 'lg' ? 'A+' : 'A++'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Família Tipográfica */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted block">Fonte do Artigo</label>
            <div className="space-y-1">
              {[
                { id: 'serif', label: 'Playfair (Editorial Serif)', fontClass: 'font-serif' },
                { id: 'sans', label: 'Inter (Moderna Sans)', fontClass: 'font-sans' },
                { id: 'dyslexic', label: 'Lexend (Amigável p/ Dislexia)', fontClass: 'font-sans' }
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => updatePreference({ fontFamily: item.id as any })}
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    pref.fontFamily === item.id
                      ? 'border-text-main bg-stone-100/80 dark:bg-stone-850 text-text-main font-semibold'
                      : 'border-transparent text-text-muted hover:bg-stone-100 dark:hover:bg-stone-800'
                  }`}
                >
                  <span className={item.fontClass}>{item.label}</span>
                  {pref.fontFamily === item.id && <Check size={13} className="text-text-main" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Espaçamento Entre Linhas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted block">Espaçamento Entre Linhas</label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-stone-100 dark:bg-stone-900/60 rounded-lg border border-border">
              {(['tight', 'normal', 'relaxed', 'loose'] as const).map((lh) => (
                <button
                  key={lh}
                  onClick={() => updatePreference({ lineHeight: lh })}
                  className={`py-1 text-[10px] uppercase font-mono font-bold rounded transition-all ${
                    pref.lineHeight === lh
                      ? 'bg-bg-main text-text-main shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {lh === 'tight' ? '1.5' : lh === 'normal' ? '1.6' : lh === 'relaxed' ? '1.8' : '2.1'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
