import { useLayoutEffect } from 'react';
import { gsap } from 'gsap';

export const useStaggeredAnimations = (
  panelRef: React.RefObject<HTMLDivElement | null>,
  position: 'left' | 'right'
) => {
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const panel = panelRef.current;
      if (!panel) return;
      const offscreen = position === 'left' ? -100 : 100;
      gsap.set(panel, { xPercent: offscreen, opacity: 1 });
    });
    return () => ctx.revert();
  }, [position]);
};
