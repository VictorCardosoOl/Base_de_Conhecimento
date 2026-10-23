import { useState, useRef, useEffect, useCallback } from 'react';
import type { Category } from '@/features/articles/types';

/**
 * Hook dedicado a controlar expansão, recolhimento e transição de mouse hover no NavDrawer
 */
export function useNavDrawerHover(currentArticleModule: Category | null) {
  const [overrides, setOverrides] = useState<Partial<Record<Category, boolean>>>({});
  const leaveTimeoutsRef = useRef<Partial<Record<Category, ReturnType<typeof setTimeout>>>>({});

  useEffect(() => {
    const timeouts = leaveTimeoutsRef.current;
    return () => {
      for (const timer of Object.values(timeouts)) {
        if (timer) clearTimeout(timer);
      }
    };
  }, []);

  const isExpanded = useCallback(
    (cat: Category) => overrides[cat] ?? cat === currentArticleModule,
    [overrides, currentArticleModule]
  );

  const toggleModule = useCallback(
    (cat: Category) =>
      setOverrides((prev) => ({ ...prev, [cat]: !(prev[cat] ?? cat === currentArticleModule) })),
    [currentArticleModule]
  );

  const handleMouseEnter = useCallback((cat: Category, hasArticles: boolean) => {
    if (!hasArticles) return;
    if (leaveTimeoutsRef.current[cat]) {
      clearTimeout(leaveTimeoutsRef.current[cat]);
      delete leaveTimeoutsRef.current[cat];
    }
    setOverrides((prev) => ({ ...prev, [cat]: true }));
  }, []);

  const handleMouseLeave = useCallback(
    (cat: Category, hasArticles: boolean) => {
      if (!hasArticles) return;
      if (leaveTimeoutsRef.current[cat]) {
        clearTimeout(leaveTimeoutsRef.current[cat]);
      }
      leaveTimeoutsRef.current[cat] = setTimeout(() => {
        if (cat !== currentArticleModule) {
          setOverrides((prev) => ({ ...prev, [cat]: false }));
        }
        delete leaveTimeoutsRef.current[cat];
      }, 150);
    },
    [currentArticleModule]
  );

  return {
    isExpanded,
    toggleModule,
    handleMouseEnter,
    handleMouseLeave,
  };
}
