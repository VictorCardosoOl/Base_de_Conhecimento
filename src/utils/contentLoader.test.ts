
import { describe, it, expect } from 'vitest';
import { loadArticles } from './contentLoader';

describe('contentLoader / FAQ_DATA integrity', () => {
  it('deve carregar artigos com sucesso', () => {
    const articles = loadArticles();
    expect(articles.length).toBeGreaterThan(0);
  });

  it('cada artigo carregado deve possuir a estrutura mínima obrigatória', () => {
    const articles = loadArticles();
    articles.forEach(article => {
      expect(article.id).toBeDefined();
      expect(typeof article.id).toBe('string');
      
      expect(article.question).toBeDefined();
      expect(article.answer).toBeDefined();
      expect(article.category).toBeDefined();
      
      // Verifica se a data segue um padrão mínimo (ex: "Jan 2025")
      expect(article.date).toMatch(/[0-9]{4}|[A-Z][a-z]{2}/);
    });
  });

  it('não deve permitir IDs duplicados na base de conhecimento', () => {
    const articles = loadArticles();
    const ids = articles.map(a => a.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  it('deve garantir que todos os artigos tenham tags definidas como array', () => {
    const articles = loadArticles();
    articles.forEach(article => {
      expect(Array.isArray(article.tags)).toBe(true);
    });
  });
});
