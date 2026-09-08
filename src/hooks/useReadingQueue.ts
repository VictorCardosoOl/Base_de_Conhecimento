
import { useState, useEffect } from 'react';

export const useReadingQueue = () => {
  const [queue, setQueue] = useState<string[]>([]);

  // Carrega a fila salva ao iniciar e escuta alteraÃ§Ãµes entre abas
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

    // Sincronia Inter-Abas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'sstfaq_queue') {
        loadFromStorage();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Salva no localStorage sempre que mudar (mas somente aÃ§Ãµes locais, o sync via storage resolve outras abas)
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

  return { queue, addToQueue, removeFromQueue, toggleQueue };
};
