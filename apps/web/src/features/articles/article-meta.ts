import { FAQ_DATA } from '@/features/articles/catalog';
import type { FAQItem } from '@/features/articles/types';

const WORDS_PER_MINUTE = 200;

/** Minutos de leitura a partir do texto puro (mínimo 1). */
export function readingMinutes(text: string | undefined | null): number | null {
  if (!text) return null;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return words ? Math.max(1, Math.round(words / WORDS_PER_MINUTE)) : null;
}

/** Texto puro do artigo no catálogo (para tempo de leitura no modal). */
export function catalogTextOf(id: string): string | undefined {
  return FAQ_DATA.find((item) => item.id === id)?.searchText;
}

/**
 * Artigos relacionados: mais tags em comum primeiro; empate, mesmo módulo. Exclui o
 * próprio artigo e os que já aparecem como anterior/próximo.
 */
export function relatedArticles(id: string, exclude: string[] = [], limit = 3): FAQItem[] {
  const current = FAQ_DATA.find((item) => item.id === id);
  if (!current) return [];
  const tags = new Set((current.tags ?? []).map((tag) => tag.toLowerCase()));
  const skip = new Set([id, ...exclude]);
  return FAQ_DATA.filter((item) => !skip.has(item.id) && item.category !== 'Sobre')
    .map((item) => {
      const shared = (item.tags ?? []).filter((tag) => tags.has(tag.toLowerCase())).length;
      const sameModule = item.category === current.category ? 1 : 0;
      return { item, score: shared * 2 + sameModule };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.item);
}

const MONTHS: Record<string, number> = {
  jan: 0, fev: 1, feb: 1, mar: 2, abr: 3, apr: 3, mai: 4, may: 4, jun: 5, jul: 6,
  ago: 7, aug: 7, set: 8, sep: 8, out: 9, oct: 9, nov: 10, dez: 11, dec: 11,
};

/**
 * Datas do frontmatter ("15 Out 2024", "04 Sep 2026" ou ISO). Devolve null se não
 * reconhecer, em vez de uma data inválida que quebraria contas de validade.
 */
export function parseArticleDate(raw: string | undefined | null): Date | null {
  if (!raw) return null;
  const text = raw.trim();
  const match = /^(\d{1,2})\s+([A-Za-zçÇ]{3})[a-zç]*\.?\s+(\d{4})$/.exec(text);
  if (match) {
    const month = MONTHS[match[2].toLowerCase()];
    if (month === undefined) return null;
    return new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
  }
  const iso = /^\d{4}-\d{2}-\d{2}/.test(text) ? new Date(text) : null;
  return iso && !Number.isNaN(iso.getTime()) ? iso : null;
}

export interface ValidityStatus {
  /** Meses desde a última revisão (ou publicação). */
  months: number;
  maxMonths: number;
  state: 'expired' | 'expiring' | 'ok';
}

/** Situação da validade do conteúdo (ciclo de revisão em meses). */
export function validityOf(item: Pick<FAQItem, 'date' | 'lastReviewed' | 'validityMonths'>, now = new Date()): ValidityStatus | null {
  const reviewed = parseArticleDate(item.lastReviewed) ?? parseArticleDate(item.date);
  if (!reviewed) return null;
  const months = Math.max(
    0,
    (now.getUTCFullYear() - reviewed.getUTCFullYear()) * 12 + (now.getUTCMonth() - reviewed.getUTCMonth())
  );
  const maxMonths = item.validityMonths || 12;
  const state = months >= maxMonths ? 'expired' : months >= maxMonths - 3 ? 'expiring' : 'ok';
  return { months, maxMonths, state };
}

/** Data mais recente do artigo (revisão ou publicação), em ms; 0 se não reconhecer. */
export function articleTime(item: Pick<FAQItem, 'date' | 'lastReviewed'>): number {
  return (parseArticleDate(item.lastReviewed) ?? parseArticleDate(item.date))?.getTime() ?? 0;
}

/** Os artigos publicados ou revisados mais recentemente (fora "Sobre"). */
export function recentArticles(limit = 3): FAQItem[] {
  return [...FAQ_DATA]
    .filter((item) => item.category !== 'Sobre')
    .sort((a, b) => articleTime(b) - articleTime(a))
    .slice(0, limit);
}
