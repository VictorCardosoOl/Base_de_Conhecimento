import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 text-xs font-mono tracking-wider uppercase border border-border shadow-2xl flex items-center gap-2 animate-fade-in-up">
      <WifiOff size={14} className="text-amber-400 dark:text-amber-600 animate-pulse" />
      <span>Você está offline. Exibindo acervo armazenado no cache local.</span>
    </div>
  );
};
