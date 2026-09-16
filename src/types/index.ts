export enum Category {
  SOBRE = 'Sobre',
  GRO = 'GRO',
  ESOCIAL = 'eSocial',
  INFORMACOES = 'Informações',
  EVENTOS = 'Eventos',
  COLETIVO = 'Coletivo',
  FINANCEIRO = 'Financeiro',
  TI = 'Tecnologia'
}

export interface FAQItem {
  id: string;
  category: Category;
  question: string;
  answer: string;
  date: string;
  excerpt?: string;
  tags?: string[];
  searchText?: string;
  content?: string | (() => Promise<{ default: { content: string } }>);
  // Gestão de Validade e Auditoria de Conteúdo
  validityMonths?: number;
  lastReviewed?: string;
  verifiedBy?: string;
}

export interface FAQItemExtended extends FAQItem {
  fileName?: string;
}

export interface LearningTrack {
  id: string;
  title: string;
  description: string;
  badge: string;
  estimatedMinutes: number;
  articleIds: string[];
}
