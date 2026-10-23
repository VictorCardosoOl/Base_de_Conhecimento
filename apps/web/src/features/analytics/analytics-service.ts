import { safeStorage } from '@/lib/storage';

const COMPLETED_ARTICLES_KEY = 'sst_completed_articles';

export const AnalyticsService = {
  // Trilhas de Onboarding: Marcação de artigo lido/concluído
  getCompletedArticles(): string[] {
    return safeStorage.getItem<string[]>(COMPLETED_ARTICLES_KEY, []);
  },

  toggleArticleCompletion(articleId: string): boolean {
    if (!articleId) return false;
    const completed = this.getCompletedArticles();
    const exists = completed.includes(articleId);
    const updated = exists
      ? completed.filter((id) => id !== articleId)
      : [...completed, articleId];
    safeStorage.setItem(COMPLETED_ARTICLES_KEY, updated);
    return !exists;
  },
};
