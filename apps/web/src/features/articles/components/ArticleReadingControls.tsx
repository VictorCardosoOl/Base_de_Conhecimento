import React, { useState, useRef, useEffect } from 'react';
import { Type, Eye, EyeOff, Check, SlidersHorizontal } from 'lucide-react';
import {
  ReadingExperienceService,
  TypographyPreferences,
} from '@/features/reading/reading-experience-service';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface ArticleReadingControlsProps {
  isZenMode: boolean;
  onToggleZenMode: () => void;
  typography?: TypographyPreferences;
  onTypographyChange?: (pref: TypographyPreferences) => void;
}

export const ArticleReadingControls: React.FC<ArticleReadingControlsProps> = ({
  isZenMode,
  onToggleZenMode,
  typography,
  onTypographyChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localPref, setLocalPref] = useState<TypographyPreferences>(() =>
    ReadingExperienceService.getTypography()
  );
  const pref = typography ?? localPref;
  const popoverRef = useRef<HTMLDivElement>(null);
  const popoverContentRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const updatePreference = (newPref: Partial<TypographyPreferences>) => {
    const updated = { ...pref, ...newPref };
    setLocalPref(updated);
    ReadingExperienceService.setTypography(updated);
    if (onTypographyChange) onTypographyChange(updated);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      setMounted(true);
    } else if (mounted) {
      // Animate out
      if (popoverContentRef.current) {
        gsap.to(popoverContentRef.current, {
          opacity: 0,
          scale: 0.95,
          y: -10,
          duration: 0.2,
          ease: 'power2.in',
          onComplete: () => setMounted(false)
        });
      }
    }
  }, [isOpen]);

  useGSAP(() => {
    if (mounted && isOpen && popoverContentRef.current) {
      // Animate in
      gsap.fromTo(popoverContentRef.current, 
        { opacity: 0, scale: 0.95, y: -10 },
        { opacity: 1, scale: 1, y: 0, duration: 0.3, ease: 'power3.out' }
      );
    }
  }, [mounted, isOpen]);

  return (
    <div className="relative inline-flex items-center gap-1" ref={popoverRef}>
      {/* Botão Modo Foco (Zen Mode) */}
      <button
        onClick={onToggleZenMode}
        title={
          isZenMode
            ? 'Sair do Modo Foco'
            : 'Modo Foco (Zen Mode - Sem Distrações)'
        }
        aria-label={isZenMode ? 'Sair do Modo Foco' : 'Ativar Modo Foco'}
        className={`p-2 rounded-full transition-colors ${
          isZenMode
            ? 'bg-black/5 dark:bg-white/10 text-text-main'
            : 'text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5'
        }`}
      >
        {isZenMode ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>

      {/* Botão de Personalização Tipográfica */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Ajuste a leitura para sua preferência visual"
        aria-label="Ajustar Tipografia e Leitura"
        className={`p-2 rounded-full text-text-muted hover:text-text-main hover:bg-black/5 dark:hover:bg-white/5 transition-colors ${
          isOpen ? 'bg-black/5 dark:bg-white/10 text-text-main' : ''
        }`}
      >
        <SlidersHorizontal size={16} />
      </button>

      {/* Popover Editorial de Configurações */}
      {mounted && (
        <div
          ref={popoverContentRef}
          className="glass-strong !bg-bg-island border border-border !absolute right-0 top-full mt-3 w-72 p-4 !rounded-[20px] z-50 space-y-4 shadow-[var(--glass-shadow-2)] transform-gpu will-change-[transform,opacity]"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <span className="text-[10px] font-mono uppercase tracking-widest text-text-muted">
              Tipografia & Leitura
            </span>
            <Type size={13} className="text-text-muted" />
          </div>

          {/* 1. Tamanho da Fonte */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted block font-mono">
              Tamanho do Texto
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-[20px] border border-border">
              {(['sm', 'base', 'lg', 'xl'] as const).map((size) => (
                <button
                  key={size}
                  onClick={() => updatePreference({ fontSize: size })}
                  className={`py-1 text-xs font-mono font-bold rounded-[20px] transition-all ${
                    pref.fontSize === size
                      ? 'bg-text-main text-bg-main shadow-sm'
                      : 'text-text-muted hover:text-text-main'
                  }`}
                >
                  {size === 'sm'
                    ? 'A-'
                    : size === 'base'
                      ? 'A'
                      : size === 'lg'
                        ? 'A+'
                        : 'A++'}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Família Tipográfica */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted block">
              Fonte do Artigo
            </label>
            <div className="space-y-1">
              {[
                {
                  id: 'serif',
                  label: 'Playfair (Editorial Serif)',
                  fontClass: 'font-serif',
                },
                {
                  id: 'sans',
                  label: 'Inter (Moderna Sans)',
                  fontClass: 'font-sans',
                },
                {
                  id: 'dyslexic',
                  label: 'Lexend (Amigável p/ Dislexia)',
                  fontClass: 'font-sans',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() =>
                    updatePreference({ fontFamily: item.id as TypographyPreferences['fontFamily'] })
                  }
                  className={`w-full flex items-center justify-between px-3 py-1.5 text-xs rounded-[20px] border transition-colors ${
                    pref.fontFamily === item.id
                      ? 'border-text-main bg-text-main/10 text-text-main font-semibold'
                      : 'border-transparent text-text-muted hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                >
                  <span className={item.fontClass}>{item.label}</span>
                  {pref.fontFamily === item.id && (
                    <Check size={13} className="text-text-main" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Espaçamento Entre Linhas */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-text-muted block font-mono">
              Espaçamento Entre Linhas
            </label>
            <div className="grid grid-cols-4 gap-1 p-1 bg-black/5 dark:bg-white/5 rounded-[20px] border border-border">
              {(['tight', 'normal', 'relaxed', 'loose'] as const).map(
                (lh) => (
                  <button
                    key={lh}
                    onClick={() => updatePreference({ lineHeight: lh })}
                    className={`py-1 text-[10px] uppercase font-mono font-bold rounded-[20px] transition-all ${
                      pref.lineHeight === lh
                        ? 'bg-text-main text-bg-main shadow-sm'
                        : 'text-text-muted hover:text-text-main'
                    }`}
                  >
                    {lh === 'tight'
                      ? '1.5'
                      : lh === 'normal'
                        ? '1.6'
                        : lh === 'relaxed'
                          ? '1.8'
                          : '2.1'}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
