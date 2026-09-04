export enum Category {
  INTRODUCAO = 'Introdução',
  GRO = 'GRO',
  ESOCIAL = 'eSocial',
  INFORMACOES = 'Informações',
  COLETIVO = 'Coletivo',
  EVENTOS = 'Eventos',
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: Category;
  tags: string[];
  content?: any;
  date?: string;
  searchText?: string;
}

