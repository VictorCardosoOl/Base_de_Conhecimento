import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import { slideUpVariants } from '@/lib/animations';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setVisible(scrolled / totalHeight > 0.3);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          variants={slideUpVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Voltar ao início da página"
          className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center bg-text-main text-bg-main shadow-2xl hover:scale-110 active:scale-90 transition-transform duration-[120ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-[transform,opacity] border border-border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2"
        >
          <ArrowUp size={18} strokeWidth={2} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};
