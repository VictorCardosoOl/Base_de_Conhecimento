
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

  // Salva no localStorage e emite evento para sincronizar outras instâncias na mesma aba
  const saveQueue = (newQueue: string[]) => {
    setQueue(newQueue);
    localStorage.setItem('sstfaq_queue', JSON.stringify(newQueue));
    window.dispatchEvent(new CustomEvent('sstfaq-queue-sync'));
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
    const targetIndex = direction === 'UP' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= queue.length) return;
    const newQueue = [...queue];
    const [removed] = newQueue.splice(index, 1);
    newQueue.splice(targetIndex, 0, removed);
    saveQueue(newQueue);
  };

  return { queue, addToQueue, removeFromQueue, toggleQueue, moveItem };
};
