
import { FAQ_DATA } from '../constants';
import { FAQItem } from '../types';

/**
 * Retorna a coleção completa de artigos da base de conhecimento.
 * No futuro, esta função pode ser estendida para suportar fetch assíncrono.
 */
export const loadArticles = (): FAQItem[] => {
  return FAQ_DATA;
};
