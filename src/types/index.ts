export enum Category {
  INTRODUCAO = 'Introdução',
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
  content?: any;
}

export interface FAQItemExtended extends FAQItem {
  fileName?: string;
}
