const COMPLETED_ARTICLES_KEY = 'sst_completed_articles';

export const AnalyticsService = {
  // Trilhas de Onboarding: Marcação de artigo lido/concluído
  getCompletedArticles(): string[] {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem(COMPLETED_ARTICLES_KEY) || '[]');
    } catch (error) {
      console.warn('Falha ao obter artigos concluidos do localStorage', error);
      return [];
    }
  },

  toggleArticleCompletion(articleId: string): boolean {
    try {
      const completed = this.getCompletedArticles();
      const exists = completed.includes(articleId);
      const updated = exists
        ? completed.filter((id) => id !== articleId)
        : [...completed, articleId];
      localStorage.setItem(COMPLETED_ARTICLES_KEY, JSON.stringify(updated));
      return !exists;
    } catch (error) {
      console.warn('Falha ao marcar artigo como concluido no localStorage', error);
      return false;
    }
  },
};
