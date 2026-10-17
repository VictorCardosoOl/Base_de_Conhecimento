import React, { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { lenisGlobalConfig } from '@/lib/animations';

interface SmoothScrollProps {
  children: React.ReactNode;
}

export const SmoothScroll: React.FC<SmoothScrollProps> = ({ children }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    // Configuração centralizada em src/lib/animations.ts → lenisGlobalConfig
    // Para ajustar damping, multiplier ou easing, edite apenas aquele arquivo.
    const lenis = new Lenis(lenisGlobalConfig);
    lenisRef.current = lenis;

    // RAF nativo — sem GSAP para não inflar o bundle
    let rafId: number;
    const updateLenis = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(updateLenis);
    };
    rafId = requestAnimationFrame(updateLenis);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
};
