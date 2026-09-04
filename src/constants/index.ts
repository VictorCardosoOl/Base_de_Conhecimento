import { FAQItem, Category } from '../types/index';
import catalog from '../data/catalog.json';
import { ARTICLE_CONTENT_MAP } from '../data/mapping';

// Converts the JSON catalog + Lazy Load Map into the application's FAQItem format
export const FAQ_DATA: FAQItem[] = catalog.map((item: any) => ({
  id: item.id,
  question: item.question,
  answer: item.answer,
  category: item.category as Category,
  date: item.date,
  searchText: item.searchText,
  tags: item.tags || [],
  content: ARTICLE_CONTENT_MAP[item.id]
})) as FAQItem[];
