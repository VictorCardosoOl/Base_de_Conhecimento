import React, { useState, useEffect, useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

export const BackToTopButton: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY;
          const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
          if (totalHeight > 0) {
            setVisible(scrolled / totalHeight > 0.3);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useGSAP(() => {
    if (!btnRef.current) return;
    if (visible) {
      gsap.to(btnRef.current, {
        opacity: 1,
        y: 0,
        pointerEvents: 'auto',
        duration: 0.38,
        ease: 'power4.out',
        overwrite: 'auto'
      });
    } else {
      gsap.to(btnRef.current, {
        opacity: 0,
        y: 10,
        pointerEvents: 'none',
        duration: 0.22,
        ease: 'power3.in',
        overwrite: 'auto'
      });
    }
  }, [visible]);

  return (
    <button
      ref={btnRef}
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Voltar ao início da página"
      className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full flex items-center justify-center bg-text-main text-bg-main shadow-2xl hover:scale-110 active:scale-90 transition-transform duration-[120ms] ease-[cubic-bezier(0.16,1,0.3,1)] transform-gpu will-change-[transform,opacity] border border-border cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-text-main focus-visible:ring-offset-2 opacity-0 pointer-events-none translate-y-2.5"
    >
      <ArrowUp size={18} strokeWidth={2} />
    </button>
  );
};
