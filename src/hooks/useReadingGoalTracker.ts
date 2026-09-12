import { useState, useEffect, useCallback } from 'react';
import { ReadingExperienceService } from '../services/readingExperienceService';

interface UseReadingGoalTrackerOptions {
  articleId: string;
  isActive: boolean;
}

export function useReadingGoalTracker({ articleId, isActive }: UseReadingGoalTrackerOptions) {
  const [goalReachedBanner, setGoalReachedBanner] = useState(false);

  useEffect(() => {
    if (!isActive || !articleId) return;

    // Registra artigo lido recentemente
    ReadingExperienceService.addRecentArticle(articleId);

    const interval = setInterval(() => {
      // Contabiliza tempo apenas se a janela estiver visível e ativa
      if (document.visibilityState === 'visible') {
        const { completedNow } = ReadingExperienceService.addReadingTime(1);
        if (completedNow) {
          setGoalReachedBanner(true);
        }
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isActive, articleId]);

  const dismissBanner = useCallback(() => {
    setGoalReachedBanner(false);
  }, []);

  return {
    goalReachedBanner,
    dismissBanner
  };
}
