export enum Category {
  SOBRE = 'Sobre',
  GRO = 'GRO',
  ESOCIAL = 'eSocial',
  INFORMACOES = 'Informações',
  EVENTOS = 'Eventos',
  COLETIVO = 'Coletivo',
  TI = 'Tecnologia',
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
  /** Autoria declarada no frontmatter (`author`). */
  author?: string;
}
