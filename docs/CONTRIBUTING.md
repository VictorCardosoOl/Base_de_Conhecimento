# Guia de Contribuição - SST FAQ

Bem-vindo(a) ao repositório do SST FAQ! Este guia foi feito para manter a base de código limpa, coesa e alinhada às decisões de engenharia arquitetural adotadas.

## 1. Adicionando Novos Artigos de SST

Todo conteúdo de artigos reside isoladamente em arquivos Markdown puros na pasta `src/content/artigos/`. O sistema lê essa pasta e compila automaticamente.

### Regras do Frontmatter
Todo arquivo `.md` precisa obrigatoriamente iniciar com um cabeçalho YML delimitado por `---`, contendo as chaves de indexação:

```markdown
---
id: nome-unico-do-artigo
category: eSocial (ou qualquer Category válida do types/index.ts)
date: "08/09/2026"
tags: [sst, pgr, segurança]
---
# Seu título aqui (Apenas 1 # no artigo)

Conteúdo do artigo em parágrafos comuns...
```

> **Atenção:** Se faltar o `id`, o script pulará a conversão deste arquivo no catálogo e emitirá um `⚠️ Warning` no build. O `id` deve ser **único e em kebab-case**.

## 2. Padrões de Componentização (Clean Code)

O repositório é rigoroso em relação ao **Princípio da Responsabilidade Única (SRP)**.

- **Evite God Components:** Nunca agrupe requisições lógicas, formatação, animação e 10 tags HTML soltas no mesmo arquivo. (Vide exemplo do antigo `ArticleView.tsx`, que foi reestruturado em múltiplos micro-componentes).
- **Semântica e Acessibilidade (WCAG):** 
  - Elementos clicáveis que não navegam externamente devem ser `<button>`, NÃO `<div> onClick={...}`.
  - Para atalhos complexos, adicione eventos de teclado nativos para uso pleno via (Tab / Espaço / Enter).

## 3. Padrão de Estilos Dinâmicos (Tailwind v4)

Todo nosso tema usa variáveis responsivas vinculadas a tokens globais, orquestradas em `src/assets/styles/global.css`.

Ao estilizar novos elementos, **UTILIZE AS VARIÁVEIS DO FRAMEWORK** ao invés de usar notação arbitrária injetada:
✅ `className="bg-bg-island text-text-muted border-border"`
❌ `className="bg-[var(--bg-island)] text-[var(--text-muted)]"` (Arbitrário/Forçado)

- As variáveis atuais habilitadas na paleta para o Light/Dark mode são: `bg-main`, `bg-island`, `text-main`, `text-body`, `text-muted`, `accent`, `border`, `selection`.

## 4. Fail-Fast em Erros (Tratamento)

Não engula exceções silenciosamente. Ao manusear promessas, acessos a LocalStorage ou APIs, caso crie um bloco `try/catch`, sempre adicione log ou tratativa de estado:
✅ `catch (e) { console.error('Motivo da falha:', e); }`
❌ `catch (e) {}`

## 5. Processo de Build Local

Sempre rode o processo completo ao alterar Markdown, pois o Vite consome um catálogo pré-compilado:
```bash
npm run dev
# (Isso rodará implicitamente o npm run gen:catalog por baixo dos panos)
```

Obrigado por contribuir e manter o nível técnico do nosso repositório elevado! 🚀
