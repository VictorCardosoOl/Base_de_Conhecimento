import { FAQItem, Category } from '../types/index';
import catalog from '../data/catalog.json';
import { ARTICLE_CONTENT_MAP } from '../data/mapping';

const mapCategory = (cat?: string): Category => {
  if (!cat) return Category.INTRODUCAO;
  const normalized = cat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  switch (normalized) {
    case 'esocial': return Category.ESOCIAL;
    case 'eventos': return Category.EVENTOS;
    case 'informacoes': return Category.INFORMACOES;
    case 'gro': return Category.GRO;
    case 'introducao': return Category.INTRODUCAO;
    case 'coletivo': return Category.COLETIVO;
    case 'financeiro': return Category.FINANCEIRO;
    case 'tecnologia':
    case 'ti': return Category.TI;
    default: return cat as Category; // Fallback
  }
};

// Converts the JSON catalog + Lazy Load Map into the application's FAQItem format
export const FAQ_DATA: FAQItem[] = catalog.map((item: any) => ({
  id: item.id,
  question: item.question,
  answer: item.answer,
  category: mapCategory(item.category),
  date: item.date,
  searchText: item.searchText,
  tags: item.tags || [],
  content: ARTICLE_CONTENT_MAP[item.id]
})) as FAQItem[];
