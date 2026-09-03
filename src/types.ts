export enum Category {
  SST = 'Saúde e Segurança',
  PREVIDENCIARIO = 'Previdenciário',
  ESOCIAL = 'eSocial e Governo',
  TROUBLESHOOTING = 'Solução de Problemas',
  COLETIVO = 'Atendimento e Cultura',
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

