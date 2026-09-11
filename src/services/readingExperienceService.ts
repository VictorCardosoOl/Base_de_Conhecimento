export interface TypographyPreferences {
  fontSize: 'sm' | 'base' | 'lg' | 'xl';
  lineHeight: 'tight' | 'normal' | 'relaxed' | 'loose';
  fontFamily: 'serif' | 'sans' | 'dyslexic';
}

export interface ReadingGoal {
  targetMinutes: number; // 60, 120, 180, etc.
  elapsedSeconds: number;
  completedNotified: boolean;
}

export interface HighlightItem {
  id: string;
  articleId: string;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
  createdAt: number;
}

const TYPOGRAPHY_KEY = 'sst_typography_pref';
const READING_GOAL_KEY = 'sst_reading_goal';
const HIGHLIGHTS_KEY = 'sst_article_highlights';
const RECENT_SEARCHES_KEY = 'sst_recent_searches';
const RECENT_ARTICLES_KEY = 'sst_recent_articles';

export const ReadingExperienceService = {
  // 1. Personalização Tipográfica
  getTypography(): TypographyPreferences {
    try {
      const saved = localStorage.getItem(TYPOGRAPHY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { fontSize: 'base', lineHeight: 'relaxed', fontFamily: 'serif' };
  },

  setTypography(pref: TypographyPreferences) {
    try {
      localStorage.setItem(TYPOGRAPHY_KEY, JSON.stringify(pref));
      window.dispatchEvent(new CustomEvent('sst_typography_updated', { detail: pref }));
    } catch {}
  },

  // 2. Meta de Leitura Silenciosa (Apenas tempo dentro do artigo)
  getReadingGoal(): ReadingGoal {
    try {
      const saved = localStorage.getItem(READING_GOAL_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return { targetMinutes: 60, elapsedSeconds: 0, completedNotified: false };
  },

  setReadingGoalTarget(targetMinutes: number) {
    try {
      const current = this.getReadingGoal();
      const updated: ReadingGoal = {
        ...current,
        targetMinutes,
        completedNotified: current.elapsedSeconds >= targetMinutes * 60
      };
      localStorage.setItem(READING_GOAL_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sst_reading_goal_updated', { detail: updated }));
    } catch {}
  },

  addReadingTime(seconds: number): { completedNow: boolean; goal: ReadingGoal } {
    try {
      const current = this.getReadingGoal();
      const newElapsed = current.elapsedSeconds + seconds;
      const targetSeconds = current.targetMinutes * 60;
      const completedNow = !current.completedNotified && newElapsed >= targetSeconds;

      const updated: ReadingGoal = {
        ...current,
        elapsedSeconds: newElapsed,
        completedNotified: current.completedNotified || completedNow
      };

      localStorage.setItem(READING_GOAL_KEY, JSON.stringify(updated));
      return { completedNow, goal: updated };
    } catch {
      return { completedNow: false, goal: this.getReadingGoal() };
    }
  },

  resetReadingGoal() {
    try {
      const current = this.getReadingGoal();
      const updated: ReadingGoal = {
        ...current,
        elapsedSeconds: 0,
        completedNotified: false
      };
      localStorage.setItem(READING_GOAL_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('sst_reading_goal_updated', { detail: updated }));
    } catch {}
  },

  // 3. Marcações (Highlights) Locais
  getHighlights(articleId: string): HighlightItem[] {
    try {
      const all: HighlightItem[] = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '[]');
      return all.filter(h => h.articleId === articleId);
    } catch {
      return [];
    }
  },

  addHighlight(articleId: string, text: string, color: HighlightItem['color'] = 'yellow'): HighlightItem {
    const item: HighlightItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      articleId,
      text,
      color,
      createdAt: Date.now()
    };
    try {
      const all: HighlightItem[] = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '[]');
      all.unshift(item);
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(all));
      window.dispatchEvent(new CustomEvent('sst_highlights_updated', { detail: { articleId } }));
    } catch {}
    return item;
  },

  removeHighlight(id: string) {
    try {
      const all: HighlightItem[] = JSON.parse(localStorage.getItem(HIGHLIGHTS_KEY) || '[]');
      const filtered = all.filter(h => h.id !== id);
      localStorage.setItem(HIGHLIGHTS_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('sst_highlights_updated'));
    } catch {}
  },

  // 4. Buscas Recentes
  getRecentSearches(): string[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]');
    } catch {
      return [];
    }
  },

  addRecentSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) return;
    try {
      const list = this.getRecentSearches().filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      list.unshift(trimmed);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list.slice(0, 5)));
    } catch {}
  },

  // 5. Artigos Lidos Recentemente
  getRecentArticles(): string[] {
    try {
      return JSON.parse(localStorage.getItem(RECENT_ARTICLES_KEY) || '[]');
    } catch {
      return [];
    }
  },

  addRecentArticle(articleId: string) {
    if (!articleId) return;
    try {
      const list = this.getRecentArticles().filter(id => id !== articleId);
      list.unshift(articleId);
      localStorage.setItem(RECENT_ARTICLES_KEY, JSON.stringify(list.slice(0, 5)));
    } catch {}
  }
};
