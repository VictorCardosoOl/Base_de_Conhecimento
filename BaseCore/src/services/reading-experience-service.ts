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
const RECENT_LIMIT = 5;

const DEFAULT_TYPOGRAPHY: TypographyPreferences = {
  fontSize: 'base',
  lineHeight: 'relaxed',
  fontFamily: 'serif',
};

const logStorageError = (err: unknown) => console.error('Storage Error:', err);

/** Lê e desserializa um valor do localStorage; retorna `fallback` em ausência ou erro. */
function readJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const saved = localStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : fallback;
  } catch (err) {
    logStorageError(err);
    return fallback;
  }
}

/** Serializa e grava no localStorage, opcionalmente emitindo um CustomEvent. Retorna sucesso. */
function writeJSON(
  key: string,
  value: unknown,
  event?: { name: string; detail?: unknown }
): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (event) {
      window.dispatchEvent(new CustomEvent(event.name, { detail: event.detail }));
    }
    return true;
  } catch (err) {
    logStorageError(err);
    return false;
  }
}

/** Insere `value` no topo de uma lista MRU, removendo duplicatas e limitando o tamanho. */
function pushRecent(
  key: string,
  value: string,
  isSame: (a: string, b: string) => boolean
) {
  const list = readJSON<string[]>(key, []).filter((v) => !isSame(v, value));
  list.unshift(value);
  writeJSON(key, list.slice(0, RECENT_LIMIT));
}

export const ReadingExperienceService = {
  // 1. Personalização Tipográfica
  getTypography(): TypographyPreferences {
    return readJSON(TYPOGRAPHY_KEY, DEFAULT_TYPOGRAPHY);
  },

  setTypography(pref: TypographyPreferences) {
    writeJSON(TYPOGRAPHY_KEY, pref, { name: 'sst_typography_updated', detail: pref });
  },

  // 2. Meta de Leitura Silenciosa (Apenas tempo dentro do artigo)
  getReadingGoal(): ReadingGoal {
    return readJSON<ReadingGoal>(READING_GOAL_KEY, {
      targetMinutes: 60,
      elapsedSeconds: 0,
      completedNotified: false,
    });
  },

  setReadingGoalTarget(targetMinutes: number) {
    const current = this.getReadingGoal();
    const updated: ReadingGoal = {
      ...current,
      targetMinutes,
      completedNotified: current.elapsedSeconds >= targetMinutes * 60,
    };
    writeJSON(READING_GOAL_KEY, updated, { name: 'sst_reading_goal_updated', detail: updated });
  },

  addReadingTime(seconds: number): {
    completedNow: boolean;
    goal: ReadingGoal;
  } {
    const current = this.getReadingGoal();
    const newElapsed = current.elapsedSeconds + seconds;
    const completedNow =
      !current.completedNotified && newElapsed >= current.targetMinutes * 60;

    const updated: ReadingGoal = {
      ...current,
      elapsedSeconds: newElapsed,
      completedNotified: current.completedNotified || completedNow,
    };

    if (!writeJSON(READING_GOAL_KEY, updated)) {
      return { completedNow: false, goal: this.getReadingGoal() };
    }
    return { completedNow, goal: updated };
  },

  resetReadingGoal() {
    const updated: ReadingGoal = {
      ...this.getReadingGoal(),
      elapsedSeconds: 0,
      completedNotified: false,
    };
    writeJSON(READING_GOAL_KEY, updated, { name: 'sst_reading_goal_updated', detail: updated });
  },

  // 3. Marcações (Highlights) Locais
  getHighlights(articleId: string): HighlightItem[] {
    return readJSON<HighlightItem[]>(HIGHLIGHTS_KEY, []).filter(
      (h) => h.articleId === articleId
    );
  },

  addHighlight(
    articleId: string,
    text: string,
    color: HighlightItem['color'] = 'yellow'
  ): HighlightItem {
    const item: HighlightItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      articleId,
      text,
      color,
      createdAt: Date.now(),
    };
    const all = readJSON<HighlightItem[]>(HIGHLIGHTS_KEY, []);
    all.unshift(item);
    writeJSON(HIGHLIGHTS_KEY, all, { name: 'sst_highlights_updated', detail: { articleId } });
    return item;
  },

  removeHighlight(id: string) {
    const filtered = readJSON<HighlightItem[]>(HIGHLIGHTS_KEY, []).filter(
      (h) => h.id !== id
    );
    writeJSON(HIGHLIGHTS_KEY, filtered, { name: 'sst_highlights_updated' });
  },

  // 4. Buscas Recentes
  getRecentSearches(): string[] {
    return readJSON<string[]>(RECENT_SEARCHES_KEY, []);
  },

  addRecentSearch(query: string) {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    pushRecent(
      RECENT_SEARCHES_KEY,
      trimmed,
      (a, b) => a.toLowerCase() === b.toLowerCase()
    );
  },

  // 5. Artigos Lidos Recentemente
  getRecentArticles(): string[] {
    return readJSON<string[]>(RECENT_ARTICLES_KEY, []);
  },

  addRecentArticle(articleId: string) {
    if (!articleId) return;
    pushRecent(RECENT_ARTICLES_KEY, articleId, (a, b) => a === b);
  },
};
