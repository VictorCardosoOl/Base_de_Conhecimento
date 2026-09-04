import { FAQ_DATA } from '../constants/index';
import { FAQItem } from '../types/index';

/**
 * Interface para abstração da camada de dados (Repository Pattern).
 * Prepara o sistema para migração futura para chamadas REST/GraphQL.
 */
export interface IArticleService {
  getAllArticles(): Promise<FAQItem[]>;
  getArticleById(id: string): Promise<FAQItem | undefined>;
}

/**
 * Implementação local do serviço de artigos utilizando os dados em memória.
 */
class LocalArticleService implements IArticleService {
  async getAllArticles(): Promise<FAQItem[]> {
    return new Promise((resolve) => {
      resolve(FAQ_DATA);
    });
  }

  async getArticleById(id: string): Promise<FAQItem | undefined> {
    return new Promise((resolve) => {
      resolve(FAQ_DATA.find(item => item.id === id));
    });
  }
}

export const articleService = new LocalArticleService();

/**
 * @deprecated Use articleService.getAllArticles() ao invés dessa função síncrona.
 * Mantida temporariamente para não quebrar hooks existentes na Fase 1.
 */
export const loadArticles = (): FAQItem[] => {
  return FAQ_DATA;
};
