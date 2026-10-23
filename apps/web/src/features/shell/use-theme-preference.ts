'use client';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { THEME_STORAGE_KEY } from './theme-storage';
import { safeStorage } from '@/lib/storage';

const emptySubscribe = () => () => {};
const getClientMounted = () => true;
const getServerMounted = () => false;

function getInitialTheme(): boolean {
  if (typeof window === 'undefined') return false;
  const saved = safeStorage.getString(THEME_STORAGE_KEY, '');
  if (saved) return saved === 'true';
  return Boolean(
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

/**
 * Tema claro/escuro: preferência salva, senão a do sistema.
 * Utiliza inicialização preguiçosa e useSyncExternalStore para evitar cascading renders.
 */
export function useThemePreference() {
  const isMounted = useSyncExternalStore(emptySubscribe, getClientMounted, getServerMounted);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(getInitialTheme);

  useEffect(() => {
    if (!isMounted) return;
    safeStorage.setItem(THEME_STORAGE_KEY, String(isDarkMode));
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.body.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
  }, [isDarkMode, isMounted]);

  return { isDarkMode, setIsDarkMode, isMounted };
}
