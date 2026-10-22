'use client';
import { useEffect, type Dispatch, type SetStateAction } from 'react';

/**
 * Atalhos globais da paleta de comandos: Ctrl/⌘+K alterna; "/" abre (fora de campos de
 * texto e fora da página de artigo, onde "/" fica livre para a leitura). O Esc com a
 * paleta aberta é tratado pela própria CommandPalette.
 */
export function useCommandPaletteShortcuts(
  setIsOpen: Dispatch<SetStateAction<boolean>>,
  isArticleRoute: boolean | undefined
) {
  useEffect(() => {
    const handleGlobalKeys = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      const isEditing = activeTag === 'input' || activeTag === 'textarea';

      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === '/' && !isEditing && !isArticleRoute) {
        e.preventDefault();
        setIsOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeys);
    return () => window.removeEventListener('keydown', handleGlobalKeys);
  }, [setIsOpen, isArticleRoute]);
}
