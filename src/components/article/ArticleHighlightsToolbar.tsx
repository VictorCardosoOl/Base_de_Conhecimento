import React, { useEffect, useState } from 'react';
import { Highlighter, Trash2, Check } from 'lucide-react';
import { ReadingExperienceService, HighlightItem } from '../../services/readingExperienceService';

interface ArticleHighlightsToolbarProps {
  articleId: string;
  containerRef: React.RefObject<HTMLElement | null>;
}

export const ArticleHighlightsToolbar: React.FC<ArticleHighlightsToolbarProps> = ({
  articleId,
  containerRef
}) => {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState<string>('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      const text = selection.toString().trim();
      if (text.length < 3) {
        setPosition(null);
        setSelectedText('');
        return;
      }

      // Certificar que a seleção está dentro do contêiner do artigo
      const container = containerRef.current;
      if (!container || !container.contains(selection.anchorNode)) {
        setPosition(null);
        return;
      }

      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
      setSelectedText(text);
    };

    document.addEventListener('selectionchange', handleSelection);
    return () => document.removeEventListener('selectionchange', handleSelection);
  }, [containerRef]);

  const applyHighlight = (color: HighlightItem['color']) => {
    if (!selectedText) return;

    ReadingExperienceService.addHighlight(articleId, selectedText, color);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      setPosition(null);
      window.getSelection()?.removeAllRanges();
    }, 400);
  };

  if (!position || !selectedText) return null;

  return (
    <div
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)'
      }}
      className="fixed z-50 flex items-center gap-1.5 p-1.5 bg-bg-island backdrop-blur-xl border border-border shadow-2xl rounded-full animate-fade-in-up"
      onMouseDown={(e) => e.preventDefault()} // Impede perder a seleção ao clicar
    >
      {savedSuccess ? (
        <div className="flex items-center gap-1 px-3 py-1 text-xs text-emerald-600 font-medium">
          <Check size={14} />
          <span>Destacado</span>
        </div>
      ) : (
        <>
          <div className="flex items-center pl-2 pr-1 text-text-muted">
            <Highlighter size={13} />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => applyHighlight('yellow')}
              title="Marca-texto Amarelo"
              className="w-5 h-5 rounded-full bg-amber-300 hover:scale-110 transition-transform border border-amber-400"
            />
            <button
              onClick={() => applyHighlight('green')}
              title="Marca-texto Verde"
              className="w-5 h-5 rounded-full bg-emerald-300 hover:scale-110 transition-transform border border-emerald-400"
            />
            <button
              onClick={() => applyHighlight('blue')}
              title="Marca-texto Azul"
              className="w-5 h-5 rounded-full bg-sky-300 hover:scale-110 transition-transform border border-sky-400"
            />
            <button
              onClick={() => applyHighlight('pink')}
              title="Marca-texto Rosa"
              className="w-5 h-5 rounded-full bg-pink-300 hover:scale-110 transition-transform border border-pink-400"
            />
          </div>
        </>
      )}
    </div>
  );
};
