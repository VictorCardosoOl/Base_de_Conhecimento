# ✍️ Inserção de novos artigos

Os artigos são arquivos Markdown em `src/content/artigos/`. Não há banco nem painel de
publicação: o artigo entra no site pelo git. Antes de `npm run dev` e de `npm run build`,
o script `scripts/generate-catalog.js` gera o catálogo em `src/data/`. A arquitetura está em
[ARQUITETURA.md](./ARQUITETURA.md).

---

## Passo a passo

### 1. Crie o arquivo

Crie `src/content/artigos/<Pasta>/<nome-do-artigo>.md`. As pastas atuais são `Coletivo`,
`eSocial`, `Eventos`, `financeiro`, `GRO`, `Informacoes` e `TI`. A pasta só organiza os
arquivos: quem define a categoria no site é o campo `category` do frontmatter.

### 2. Preencha o frontmatter

```markdown
---
id: 'evento-s2240-condicoes-ambientais'
question: 'S-2240: Condições Ambientais do Trabalho'
category: 'Eventos'
date: '04 Sep 2026'
tags: ['eSocial', 'S-2240']
answer: 'Resumo curto (1–2 frases) mostrado no card.'
---

Conteúdo em **Markdown**...
```

| Campo                   | Obrigatório? | Se faltar                                                         |
| ----------------------- | ------------ | ----------------------------------------------------------------- |
| `id`                    | recomendado  | usa o nome do arquivo. Só ficam letras, números, `-` e `_`.       |
| `question` (ou `title`) | recomendado  | usa o nome do arquivo.                                            |
| `category`              | recomendado  | fica "Geral" e o artigo só aparece em "Acervo", em nenhum módulo. |
| `date`                  | recomendado  | —                                                                 |
| `tags`                  | não          | lista vazia                                                       |
| `answer`                | não          | os primeiros 160 caracteres do texto                              |
| `validityMonths`        | não          | 12 meses para `GRO` e `eSocial`; sem prazo nas demais             |
| `lastReviewed`          | não          | a data de revisão não aparece (não usa o valor de `date`)         |
| `verifiedBy`            | não          | o revisor não aparece (nenhum valor padrão)                       |
| `author`                | não          | o autor não aparece                                               |

**Categorias aceitas** (maiúsculas e acentos não importam):

| Valor no frontmatter    | Módulo no site |
| ----------------------- | -------------- |
| `eSocial`               | eSocial        |
| `Eventos`               | Eventos        |
| `Informacoes`           | Informações    |
| `GRO`                   | GRO            |
| `Coletivo`              | Coletivo       |
| `Financeiro`            | Financeiro     |
| `Tecnologia` ou `TI`    | Tecnologia     |
| `Sobre` ou `Introducao` | Sobre          |

Uma categoria nova exige código, nas duas partes que definem as categorias:

- o enum `Category`, em `src/features/articles/types.ts` (o menu lista os módulos a partir
  dele);
- o mapeamento, em `src/features/articles/catalog.ts`.

### 3. Escreva o conteúdo

- Markdown comum: títulos, listas, tabelas, citações, código, links e imagens.
- O HTML é sanitizado: `<script>`, `<iframe>`, `<svg>`, `style` e handlers `on*` são
  descartados. A lista de tags permitidas está em `src/features/articles/sanitize-html.ts`.
- Imagens podem ser URLs `http(s)` ou imagens embutidas em base64 (`data:`).
- Termos de `src/data/glossary.json` ganham uma dica ao passar o mouse quando o artigo é
  aberto pela home. Hoje o glossário está vazio.

### 4. Gere o catálogo, confira e faça o commit

```bash
npm run dev
```

O comando regenera o catálogo. Abra o artigo pela home (modal) e por `/artigo/<id>`. Faça o
commit do `.md` **e** dos arquivos alterados em `src/data/`: eles são versionados e gerados
sempre do mesmo jeito, então o diff mostra só o que mudou.

---

## Padrão editorial

1. **Voz e tom:** linguagem técnica, porém acessível.
2. **IDs:** únicos e descritivos. A "Minha lista" e as trilhas de leitura guardam o `id`;
   mudar o `id` de um artigo existente tira esse artigo das listas já salvas.
3. **Tags:** palavras que alguém digitaria na busca. A busca indexa título, tags, resumo,
   categoria e texto.

---

## Checklist de revisão

- [ ] O `id` é único?
- [ ] A categoria é uma das aceitas?
- [ ] O Markdown renderiza direito (crases e tabelas fechadas)?
- [ ] As tags são relevantes?
- [ ] O resumo (`answer`) é bom?
- [ ] Os arquivos de `src/data/` regenerados entraram no commit?
