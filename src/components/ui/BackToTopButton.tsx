import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setVisible(scrolled / totalHeight > 0.3);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao início da página"
      className="fixed bottom-6 right-6 z-40 p-3 bg-text-main text-bg-main shadow-xl hover:opacity-85 transition-all duration-200 animate-fade-in-up border border-border"
    >
      <ArrowUp size={16} />
    </button>
  );
};
