
import { useState, useEffect } from 'react';

export const useReadingQueue = () => {
  const [queue, setQueue] = useState<string[]>([]);

  // Carrega a fila salva ao iniciar
  useEffect(() => {
    // Migration Logic: Check for old key
    const oldSaved = localStorage.getItem('teamwiki_queue');
    if (oldSaved) {
      localStorage.setItem('sstfaq_queue', oldSaved);
      localStorage.removeItem('teamwiki_queue');
      try {
        setQueue(JSON.parse(oldSaved));
        return;
      } catch (e) { }
    }

    const saved = localStorage.getItem('sstfaq_queue');
    if (saved) {
      try {
        setQueue(JSON.parse(saved));
      } catch (e) {
        console.error("Erro ao carregar fila de leitura", e);
      }
    }
  }, []);

  // Salva no localStorage sempre que mudar
  const saveQueue = (newQueue: string[]) => {
    setQueue(newQueue);
    localStorage.setItem('sstfaq_queue', JSON.stringify(newQueue));
  };

  const addToQueue = (id: string) => {
    if (!queue.includes(id)) {
      saveQueue([...queue, id]);
    }
  };

  const removeFromQueue = (id: string) => {
    saveQueue(queue.filter(itemId => itemId !== id));
  };

  const toggleQueue = (id: string) => {
    if (queue.includes(id)) {
      removeFromQueue(id);
    } else {
      addToQueue(id);
    }
  };

  const moveItem = (id: string, direction: 'UP' | 'DOWN') => {
    const index = queue.indexOf(id);
    if (index === -1) return;

    const newQueue = [...queue];
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newQueue.length) {
      [newQueue[index], newQueue[targetIndex]] = [newQueue[targetIndex], newQueue[index]];
      saveQueue(newQueue);
    }
  };

  return { queue, addToQueue, removeFromQueue, toggleQueue, moveItem };
};
