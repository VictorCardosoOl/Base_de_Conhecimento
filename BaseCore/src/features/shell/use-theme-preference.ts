'use client';
import { useEffect, useState } from 'react';
import { THEME_STORAGE_KEY } from './theme-storage';

/**
 * Tema claro/escuro: preferência salva, senão a do sistema. Só grava e aplica no DOM
 * depois de montar (`isMounted`), para não sobrescrever a escolha salva com o valor
 * inicial do servidor (false).
 */
export function useThemePreference() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved !== null) {
      setIsDarkMode(saved === 'true');
    } else {
      setIsDarkMode(
        window.matchMedia &&
          window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode, isMounted]);

  return { isDarkMode, setIsDarkMode, isMounted };
}
