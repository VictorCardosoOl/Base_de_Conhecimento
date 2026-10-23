import { FAQItem, Category } from './types';
import catalog from '@/data/catalog.json';
import { ARTICLE_CONTENT_MAP } from '@/data/mapping';

const mapCategory = (cat?: string): Category => {
  if (!cat) return Category.SOBRE;
  const normalized = cat
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  switch (normalized) {
    case 'esocial':
      return Category.ESOCIAL;
    case 'eventos':
      return Category.EVENTOS;
    case 'informacoes':
      return Category.INFORMACOES;
    case 'gro':
      return Category.GRO;
    case 'introducao':
      return Category.SOBRE;
    case 'sobre':
      return Category.SOBRE;
    case 'coletivo':
      return Category.COLETIVO;
    case 'tecnologia':
    case 'ti':
      return Category.TI;
    default:
      return cat as Category; // Fallback
  }
};

export interface CatalogRawItem {
  id: string;
  category?: string;
  question: string;
  answer: string;
  date: string;
  searchText?: string;
  tags?: string[];
  validityMonths?: number;
  lastReviewed?: string;
  verifiedBy?: string;
  author?: string;
}

// Converts the JSON catalog + Lazy Load Map into the application's FAQItem format
export const FAQ_DATA: FAQItem[] = catalog.map((item: CatalogRawItem) => ({
  id: item.id,
  question: item.question,
  answer: item.answer,
  category: mapCategory(item.category),
  date: item.date,
  searchText: item.searchText,
  tags: item.tags || [],
  content: ARTICLE_CONTENT_MAP[item.id],
  validityMonths:
    item.validityMonths ??
    (item.category === 'GRO' || item.category === 'eSocial' ? 12 : undefined),
  // Só o que o artigo declara: sem revisor nem data de revisão inventados.
  lastReviewed: item.lastReviewed,
  verifiedBy: item.verifiedBy,
  author: item.author,
})) as FAQItem[];
