import { useState, useEffect, RefObject } from 'react';

export function useReadingProgress(containerRef: RefObject<HTMLElement | null>) {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const windowHeight = scrollHeight - clientHeight;
      if (windowHeight <= 0) {
        setScrollProgress(0);
        return;
      }
      const progress = scrollTop / windowHeight;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    // Run once on mount
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [containerRef]);

  return scrollProgress;
}
