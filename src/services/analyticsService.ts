export interface SearchLog {
  query: string;
  resultCount: number;
  timestamp: number;
}

export interface ContentFeedback {
  articleId: string;
  question: string;
  type: 'useful_yes' | 'useful_no' | 'outdated_report';
  details?: string;
  timestamp: number;
}

const SEARCH_LOGS_KEY = 'sst_search_analytics_logs';
const CONTENT_FEEDBACK_KEY = 'sst_content_feedback_logs';
const COMPLETED_ARTICLES_KEY = 'sst_completed_articles';

export const AnalyticsService = {
  logSearch(query: string, resultCount: number) {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;

    try {
      const logs: SearchLog[] = JSON.parse(localStorage.getItem(SEARCH_LOGS_KEY) || '[]');
      logs.unshift({
        query: trimmed,
        resultCount,
        timestamp: Date.now()
      });
      // Mantém os últimos 200 registros no browser
      localStorage.setItem(SEARCH_LOGS_KEY, JSON.stringify(logs.slice(0, 200)));
    } catch (e) {
      console.error('Falha ao registrar telemetria de busca:', e);
    }
  },

  getSearchLogs(): SearchLog[] {
    try {
      const logs = JSON.parse(localStorage.getItem(SEARCH_LOGS_KEY) || '[]');
      if (logs.length === 0) {
        // Mock inicial realista caso o banco local ainda esteja limpo (para recrutadores/demo)
        return [
          { query: 'adicional periculosidade inflamaveis', resultCount: 0, timestamp: Date.now() - 1000 * 60 * 42 },
          { query: 'como calcular insalubridade grau maximo', resultCount: 0, timestamp: Date.now() - 1000 * 60 * 120 },
          { query: 'exame retorno ao trabalho prazo', resultCount: 0, timestamp: Date.now() - 1000 * 60 * 240 },
          { query: 'CAT', resultCount: 4, timestamp: Date.now() - 1000 * 60 * 300 },
          { query: 'LTCAT', resultCount: 2, timestamp: Date.now() - 1000 * 60 * 500 },
          { query: 'trabalho em altura nr 35 cinto', resultCount: 0, timestamp: Date.now() - 1000 * 60 * 700 }
        ];
      }
      return logs;
    } catch {
      return [];
    }
  },

  getZeroResultSearches(): { query: string; count: number; lastSearched: number }[] {
    const logs = this.getSearchLogs();
    const zeroLogs = logs.filter(l => l.resultCount === 0);
    const map = new Map<string, { count: number; lastSearched: number }>();

    for (const item of zeroLogs) {
      const q = item.query.toLowerCase();
      const existing = map.get(q);
      if (existing) {
        existing.count += 1;
        existing.lastSearched = Math.max(existing.lastSearched, item.timestamp);
      } else {
        map.set(q, { count: 1, lastSearched: item.timestamp });
      }
    }

    return Array.from(map.entries())
      .map(([query, data]) => ({ query, count: data.count, lastSearched: data.lastSearched }))
      .sort((a, b) => b.count - a.count);
  },

  submitFeedback(feedback: Omit<ContentFeedback, 'timestamp'>) {
    try {
      const logs: ContentFeedback[] = JSON.parse(localStorage.getItem(CONTENT_FEEDBACK_KEY) || '[]');
      logs.unshift({
        ...feedback,
        timestamp: Date.now()
      });
      localStorage.setItem(CONTENT_FEEDBACK_KEY, JSON.stringify(logs.slice(0, 100)));
    } catch (e) {
      console.error('Falha ao salvar feedback:', e);
    }
  },

  getFeedbackLogs(): ContentFeedback[] {
    try {
      const logs = JSON.parse(localStorage.getItem(CONTENT_FEEDBACK_KEY) || '[]');
      if (logs.length === 0) {
        return [
          {
            articleId: 'pgr',
            question: 'PGR',
            type: 'outdated_report',
            details: 'A portaria MTE de 2026 alterou o prazo de guarda digital do inventário de riscos.',
            timestamp: Date.now() - 1000 * 60 * 60 * 12
          },
          {
            articleId: 'evento-s2210-comunicacao-cat',
            question: 'Evento S-2210 - Comunicação de Acidente de Trabalho (CAT)',
            type: 'useful_yes',
            timestamp: Date.now() - 1000 * 60 * 60 * 24
          }
        ];
      }
      return logs;
    } catch {
      return [];
    }
  },

  // Trilhas de Onboarding: Marcação de artigo lido/concluído
  getCompletedArticles(): string[] {
    try {
      return JSON.parse(localStorage.getItem(COMPLETED_ARTICLES_KEY) || '[]');
    } catch {
      return [];
    }
  },

  toggleArticleCompletion(articleId: string): boolean {
    try {
      const completed = this.getCompletedArticles();
      const exists = completed.includes(articleId);
      const updated = exists ? completed.filter(id => id !== articleId) : [...completed, articleId];
      localStorage.setItem(COMPLETED_ARTICLES_KEY, JSON.stringify(updated));
      return !exists;
    } catch {
      return false;
    }
  }
};
