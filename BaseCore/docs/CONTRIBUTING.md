# Guia de Contribuição - SST FAQ

Bem-vindo(a) ao repositório do SST FAQ! Este guia foi feito para manter a base de código limpa, coesa e alinhada às decisões de engenharia arquitetural adotadas.

> Fluxo de branches, padrão de commits, testes, CI e regras de segredos valem para o repositório
> inteiro e estão no [CONTRIBUTING.md da raiz](../../CONTRIBUTING.md). Este guia trata só do que é
> específico da BaseCore.

## 1. Adicionando Novos Artigos de SST

Os artigos são arquivos Markdown em `src/content/artigos/`. O passo a passo (frontmatter,
categorias aceitas, o que acontece quando um campo falta e o checklist) está em
[INSERCAO_ARTIGOS.md](./INSERCAO_ARTIGOS.md).

## 2. Organização do código e componentização

A estrutura (`src/app` para rotas, `src/features/<domínio>` para a lógica e os componentes de
cada área, e `components/ui`, `hooks` e `lib` só para o que é genérico), as regras de
dependência e as convenções de nomes e imports estão em [ARQUITETURA.md](./ARQUITETURA.md).

O repositório segue o **Princípio da Responsabilidade Única (SRP)**.

- **Evite God Components:** não junte busca de dados, formatação, animação e muita marcação
  no mesmo arquivo. Extraia hooks e subcomponentes (ex.: o `ClientLayout` delega tema,
  posição do menu e atalhos a hooks em `features/shell`).
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

O site usa um catálogo pré-gerado a partir do Markdown. `npm run dev` e `npm run build`
regeneram esse catálogo antes de começar (scripts `predev` e `prebuild`, que chamam
`npm run catalog`):

```bash
npm run dev
```

Antes de enviar uma mudança, rode `npm run check` (lint, tipos e testes unitários) e
`npm run build`. Para subir o projeto completo, com login, veja
[RODANDO_LOCALMENTE.md](./RODANDO_LOCALMENTE.md).

Obrigado por contribuir e manter o nível técnico do nosso repositório elevado! 🚀
