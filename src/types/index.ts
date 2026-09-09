export enum Category {
  INTRODUCAO = 'INTRODU',
  GRO = 'GRO',
  ESOCIAL = 'ESOCIAL',
  INFORMACOES = 'INFORMACOES',
  EVENTOS = 'EVENTOS'
}

export interface FAQItem {
  id: string;
  category: Category;
  question: string;
  answer: string;
  date: string;
  excerpt?: string;
}

export interface FAQItemExtended extends FAQItem {
  fileName?: string;
  content?: any;
  searchText?: string;
}
