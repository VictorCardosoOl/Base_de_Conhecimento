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
  content: ARTICLE_CONTENT_MAP[item.id],
  validityMonths: item.validityMonths ?? (item.category === 'GRO' || item.category === 'eSocial' ? 12 : undefined),
  lastReviewed: item.lastReviewed ?? item.date ?? '01 Jan 2026',
  verifiedBy: item.verifiedBy ?? 'Engenharia de SST / Jurídico Trabalhista'
})) as FAQItem[];

export const DEFAULT_LEARNING_TRACKS = [
  {
    id: 'trilha-onboarding-sst',
    title: 'Trilha Básica: Onboarding em SST & NR-01',
    description: 'Imersão obrigatória para novos colaboradores: conceitos de risco ocupacional, PGR e diretrizes da NR-01.',
    badge: 'Onboarding Obrigatório',
    estimatedMinutes: 25,
    articleIds: ['intro-sst', 'pgr', 'pcmso', 'diferenca-li-lp']
  },
  {
    id: 'trilha-esocial-compliance',
    title: 'Trilha Avançada: Transmissão e Eventos eSocial',
    description: 'Guia passo a passo para a correta validação e envio dos eventos S-2210, S-2220 e S-2240.',
    badge: 'Conformidade Legal',
    estimatedMinutes: 35,
    articleIds: ['esocial-sst-transmission', 'evento-s2210-comunicacao-cat', 'evento-s2220-monitoramento-saude', 'evento-s2240-condicoes-ambientais']
  },
  {
    id: 'trilha-previdencia-laudos',
    title: 'Trilha Especializada: Previdência e Documentos Periciais',
    description: 'Mapeamento de laudos técnicos, PPP eletrônico, aposentadoria especial e caracterização de insalubridade.',
    badge: 'Perícia & Previdência',
    estimatedMinutes: 30,
    articleIds: ['ltcat', 'ppp', 'aposentadoria-especial', 'aposentadoria-invalidez']
  }
];
