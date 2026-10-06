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
      } catch (error) {
        console.error('Reading Queue Error:', error);
      }
    }

    const saved = localStorage.getItem('sstfaq_queue');
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (error) {
        console.error('Reading Queue Error:', error);
      }
    }
  }, []);

  const persistQueue = (next: string[]) => {
    // Defer I/O to avoid blocking main thread (Framer Motion freeze prevention)
    setTimeout(() => {
      try {
        localStorage.setItem('sstfaq_queue', JSON.stringify(next));
      } catch (error) {
        console.error('Reading Queue Error:', error);
      }
    }, 0);
  };

  const addToQueue = (id: string) => {
    setQueue((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      persistQueue(next);
      return next;
    });
  };

  const removeFromQueue = (id: string) => {
    setQueue((prev) => {
      const next = prev.filter((itemId) => itemId !== id);
      persistQueue(next);
      return next;
    });
  };

  const toggleQueue = (id: string) => {
    setQueue((prev) => {
      const next = prev.includes(id)
        ? prev.filter((itemId) => itemId !== id)
        : [...prev, id];

      persistQueue(next);
      return next;
    });
  };

  const moveItem = (id: string, direction: 'UP' | 'DOWN') => {
    setQueue((prev) => {
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
