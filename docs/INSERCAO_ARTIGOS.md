# 📚 Guia de Inserção de Novos Artigos - TeamWiki

Este guia orienta o processo de adição de novos conteúdos à base de conhecimento. Atualmente, o projeto utiliza uma estrutura estática centralizada para garantir performance e facilidade de busca.

## 🛠️ Passo a Passo para Inserção

### 1. Verificar a Categoria

Antes de criar o artigo, certifique-se de que a categoria existe no arquivo `types.ts`.
Se precisar de uma nova categoria, adicione-a ao enum:

```typescript
// types.ts
export enum Category {
  NOVA_CATEGORIA = 'Nome da Categoria',
  // ... categorias existentes
}
```

### 2. Adicionar ao Arquivo de Constantes

A fonte de dados principal da aplicação é o arquivo `constants.ts`. Localize o array `FAQ_DATA` e adicione seu novo objeto seguindo o padrão:

```typescript
// constants.ts
export const FAQ_DATA: FAQItem[] = [
  // ... artigos existentes
  {
    id: 'id-unico-do-artigo', // Use kebab-case (ex: 'guia-de-viagens')
    question: 'Título do Artigo (Pergunta)',
    category: Category.SUA_CATEGORIA,
    date: '20 Mai 2025', // Formato: DD Mes AAAA
    tags: ['Tag1', 'Tag2'],
    answer: 'Um resumo curto e elegante (1-2 frases) que aparece no card.',
    content: `
## Título Interno
Aqui você escreve o conteúdo em **Markdown**.

> Use citações para dar ênfase a diretrizes importantes.

### Subtítulo
* Liste pontos importantes.
* Use formatação limpa.
    `,
  },
];
```

### 3. (Opcional) Criar Arquivo de Backup/Conteúdo

Embora o sistema consuma os dados de `constants.ts`, recomendamos criar um arquivo `.md` na pasta `content/[CATEGORIA]/nome-do-artigo.md` para manter um histórico limpo e facilitar futuras migrações para um CMS ou banco de dados.

## 🎨 Padrão Editorial (Best Practices)

1.  **Voz e Tom:** Mantenha uma linguagem técnica, porém acessível. Imagine o estilo de publicações como _The Economist_ ou _Monocle_.
2.  **Imagens:** Se for adicionar imagens no campo `content`, utilize links do Unsplash ou do seu CDN de preferência: `![Descrição](url_da_imagem)`.
3.  **IDs:** O `id` deve ser único e descritivo, pois ele é utilizado para a funcionalidade de "Minha Lista" (Reading Queue) via LocalStorage.
4.  **Tags:** Use tags que facilitem a busca neural da IA. Pense em palavras-chave que um usuário digitaria na busca.

## ✅ Checklist de Revisão

- [ ] O `id` é único?
- [ ] A categoria está correta?
- [ ] O Markdown está renderizando corretamente (fechamento de crases)?
- [ ] As tags são relevantes?
- [ ] O resumo (`answer`) é atrativo?
