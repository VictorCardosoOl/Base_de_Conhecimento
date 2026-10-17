# 🧩 Guia de contribuição da BaseCore

Regras específicas da BaseCore para manter o código limpo, coeso e alinhado às decisões de arquitetura.

> **Nota:** fluxo de branches, padrão de commits, testes, CI e regras de segredos valem para o repositório
> inteiro e estão no [CONTRIBUTING.md da raiz](../../CONTRIBUTING.md). Este guia trata só do que é
> específico da BaseCore.

---

## 1. Novos artigos de SST

Os artigos são arquivos Markdown em `src/content/artigos/`. O passo a passo (frontmatter,
categorias aceitas, o que acontece quando um campo falta e o checklist) está em
[INSERCAO_ARTIGOS.md](./INSERCAO_ARTIGOS.md).

---

## 2. Organização do código e componentização

A estrutura (`src/app` para rotas, `src/features/<domínio>` para a lógica e os componentes de
cada área, e `components/ui`, `hooks` e `lib` só para o que é genérico), as regras de
dependência e as convenções de nomes e imports estão em [ARQUITETURA.md](./ARQUITETURA.md).

O repositório segue o **princípio da responsabilidade única (SRP)**:

- **Evite componentes que fazem tudo:** não junte busca de dados, formatação, animação e muita marcação
  no mesmo arquivo. Extraia hooks e subcomponentes (ex.: o `ClientLayout` delega tema,
  posição do menu e atalhos a hooks em `features/shell`).
- **Semântica e acessibilidade (WCAG):**
  - elementos clicáveis que não navegam para fora devem ser `<button>`, e não `<div onClick={...}>`;
  - para atalhos complexos, use eventos de teclado nativos, para uso pleno com Tab, Espaço e Enter.

---

## 3. Estilos com tokens do tema (Tailwind v4)

O tema usa variáveis ligadas a tokens globais, definidas em `src/assets/styles/global.css`.

Ao estilizar novos elementos, **use as classes geradas pelos tokens** em vez de valores arbitrários:

| Situação | Exemplo |
| :-- | :-- |
| ✅ Recomendado | `className="bg-bg-island text-text-muted border-border"` |
| ❌ Evite | `className="bg-[var(--bg-island)] text-[var(--text-muted)]"` |

Tokens de cor disponíveis nos temas claro e escuro: `bg-main`, `bg-island`, `text-main`, `text-body`,
`text-muted`, `accent`, `border` e `selection`.

---

## 4. Erros: falhe cedo e de forma visível

Não engula exceções em silêncio. Ao lidar com promessas, `localStorage` ou APIs, todo bloco
`try/catch` precisa registrar o erro ou tratar o estado:

| Situação | Exemplo |
| :-- | :-- |
| ✅ Recomendado | `catch (e) { console.error('Motivo da falha:', e); }` |
| ❌ Evite | `catch (e) {}` |

---

## 5. Build local

O site usa um catálogo pré-gerado a partir do Markdown. `npm run dev` e `npm run build`
regeneram esse catálogo antes de começar (scripts `predev` e `prebuild`, que chamam
`npm run catalog`):

```bash
npm run dev
```

Antes de enviar uma mudança, rode `npm run check` (lint, tipos e testes unitários) e
`npm run build`. Para subir o projeto completo, com login, veja
[RODANDO_LOCALMENTE.md](./RODANDO_LOCALMENTE.md).

Obrigado por contribuir e manter o nível técnico do repositório! 🚀
