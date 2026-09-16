
import { useState, useEffect } from 'react';

export const useReadingQueue = () => {
  const [queue, setQueue] = useState<string[]>([]);

  useEffect(() => {
    // Migration Logic
    const oldSaved = localStorage.getItem('teamwiki_queue');
    if (oldSaved) {
      localStorage.setItem('sstfaq_queue', oldSaved);
      localStorage.removeItem('teamwiki_queue');
      try {
        setQueue(JSON.parse(oldSaved));
        return;
      } catch (e) {
        console.error("Erro ao carregar fila legada:", e);
      }
    }

    const saved = localStorage.getItem('sstfaq_queue');
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar fila", e);
      }
    }
  }, []);

  const persistQueue = (next: string[]) => {
    // Defer I/O to avoid blocking main thread (Framer Motion freeze prevention)
    setTimeout(() => {
      try {
        localStorage.setItem('sstfaq_queue', JSON.stringify(next));
      } catch (err) {
        console.error('Falha ao persistir fila:', err);
      }
    }, 0);
  };

  const addToQueue = (id: string) => {
    setQueue(prev => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persistQueue(next);
      return next;
    });
  };

  const removeFromQueue = (id: string) => {
    setQueue(prev => {
      const next = prev.filter(itemId => itemId !== id);
      persistQueue(next);
      return next;
    });
  };

  const toggleQueue = (id: string) => {
    setQueue(prev => {
      let next;
      if (prev.includes(id)) {
        next = prev.filter(itemId => itemId !== id);
      } else {
        next = [...prev, id];
      }
      persistQueue(next);
      return next;
    });
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
      persistQueue(next);
      return next;
    });
  };

  return { queue, addToQueue, removeFromQueue, toggleQueue, moveItem };
};
