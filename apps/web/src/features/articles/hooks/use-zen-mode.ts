import { useState, useEffect, useCallback } from 'react';

/**
 * Hook dedicado a gerenciar o estado do Modo Foco (Zen Mode) e a captura de tecla Escape
 */
export function useZenMode(isOpen: boolean, onClose: () => void) {
  const [isZenMode, setIsZenMode] = useState(false);

  // Escuta tecla ESC para sair do Zen Mode ou fechar o modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZenMode) {
          setIsZenMode(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isZenMode, onClose]);

  const toggleZenMode = useCallback(() => {
    setIsZenMode((prev) => !prev);
  }, []);

  return {
    isZenMode,
    setIsZenMode,
    toggleZenMode,
  };
}
