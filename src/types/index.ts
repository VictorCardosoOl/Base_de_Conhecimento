export enum Category {
  INTRODUCAO = 'IntroduÃ§Ã£o',
  GRO = 'GRO',
  ESOCIAL = 'eSocial',
  INFORMACOES = 'InformaÃ§Ãµes',
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

