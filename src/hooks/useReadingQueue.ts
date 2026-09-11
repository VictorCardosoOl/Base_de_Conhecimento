
import { useState, useEffect } from 'react';

export const useReadingQueue = () => {
  const [queue, setQueue] = useState<string[]>([]);

  // Carrega a fila salva ao iniciar e escuta alterações entre abas
  useEffect(() => {
    // Migration Logic: Check for old key
    const oldSaved = localStorage.getItem('teamwiki_queue');
    if (oldSaved) {
      localStorage.setItem('sstfaq_queue', oldSaved);
      localStorage.removeItem('teamwiki_queue');
      try {
        setQueue(JSON.parse(oldSaved));
        return;
      } catch (e) {
        console.error("Erro ao carregar fila legada (teamwiki_queue):", e);
      }
    }

    const loadFromStorage = () => {
      const saved = localStorage.getItem('sstfaq_queue');
      if (saved) {
        try {
          setQueue(JSON.parse(saved));
        } catch (e) {
          console.error("Erro ao carregar fila de leitura", e);
        }
      } else {
        setQueue([]);
      }
    };

    loadFromStorage();

    // Sincronia Inter-Abas e Mesma Aba
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sstfaq_queue') {
        loadFromStorage();
      }
    };
    const handleLocalSync = () => loadFromStorage();

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('sstfaq-queue-sync', handleLocalSync);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('sstfaq-queue-sync', handleLocalSync);
    };
  }, []);

  // Salva no localStorage com tratamento de erro e emite evento para sincronizar outras instâncias na mesma aba
  const saveQueue = (newQueue: string[]) => {
    setQueue(newQueue);
    try {
      localStorage.setItem('sstfaq_queue', JSON.stringify(newQueue));
      window.dispatchEvent(new CustomEvent('sstfaq-queue-sync'));
    } catch (err) {
      console.error('Falha ao persistir fila de leitura no localStorage:', err);
    }
  };

  const addToQueue = (id: string) => {
    setQueue(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem('sstfaq_queue', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('sstfaq-queue-sync'));
      } catch (err) {
        console.error('Falha ao persistir fila de leitura no localStorage:', err);
      }
      return next;
    });
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const next = prev.filter(itemId => itemId !== id);
      try {
        localStorage.setItem('sstfaq_queue', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('sstfaq-queue-sync'));
      } catch (err) {
        console.error('Falha ao persistir fila de leitura no localStorage:', err);
      }
      return next;
    });
  };

  const toggleQueue = (id: string) => {
    if (queue.includes(id)) {
      removeFromQueue(id);
    } else {
      addToQueue(id);
    }
  };

  const moveItem = (id: string, direction: 'UP' | 'DOWN') => {
    setQueue(prev => {
      const index = prev.indexOf(id);
      if (index === -1) return prev;
      const targetIndex = direction === 'UP' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;
      const next = [...prev];
      const [removed] = next.splice(index, 1);
      next.splice(targetIndex, 0, removed);
      try {
        localStorage.setItem('sstfaq_queue', JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('sstfaq-queue-sync'));
      } catch (err) {
        console.error('Falha ao persistir fila de leitura no localStorage:', err);
      }
      return next;
    });
  };

  return { queue, addToQueue, removeFromQueue, toggleQueue, moveItem };
};
