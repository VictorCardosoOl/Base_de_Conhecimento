# 🏛️ Arquitetura

Como a Base de Conhecimento (SST FAQ) está organizada, por que está assim e onde mexer para
cada tipo de mudança. Descreve o código como ele é hoje. Para rodar o projeto, veja
[RODANDO_LOCALMENTE.md](./RODANDO_LOCALMENTE.md); para os detalhes de login e permissões, veja
[docs/AUTENTICACAO.md](../../docs/AUTENTICACAO.md).

---

## Visão geral

- **Next.js 16 (App Router) + React 19 + TypeScript**, estilizado com Tailwind CSS 4.
- **Conteúdo estático:** os artigos são arquivos Markdown versionados em
  `src/content/artigos/`. Não há banco de artigos nem API de conteúdo.
- **Autenticação externa:** contas, sessões, papéis e interações dos artigos ficam no **AuthService**
  (pasta `AuthService/` do monorepo). O Next repassa `/auth/*` e `/content/*` para ele e confere a sessão
  no servidor.
- **Estado do leitor no navegador:** lista de leitura, metas, tipografia, destaques e
  métricas locais ficam no `localStorage` do próprio usuário.

```text
Navegador ──► Next (src/app)
                │  páginas e Server Actions
                ├──► src/features/*  (lógica por domínio)
                ├──► src/data/*      (catálogo gerado a partir de src/content/artigos)
                └──► /auth/* e /content/* (rewrite) ──► AuthService ──► PostgreSQL
```

---

## Organização dos diretórios

```text
src/
  app/            Rotas (App Router) e componentes exclusivos de cada rota
  features/       Código por domínio: lógica + componentes de cada área
    articles/     Catálogo, tipos, leitura dos .md, sanitização e telas de artigo
    reading/      Lista de leitura, metas, tipografia, destaques e trilhas
    search/       Índice de busca (MiniSearch), paleta de comandos e barra de busca
    analytics/    Métricas locais de uso e telemetria de erros (Sentry)
    consent/      Consentimento LGPD: armazenamento, contexto, banner e preferências de cookie
    auth/         Sessão, cliente de autenticação, Server Actions e telas de conta
    content/      Interações dos artigos (avaliação, sugestão de correção e comentários)
    legal/        Documentos institucionais (Termos, Privacidade, Cookies) e seus componentes
    navigation/   Navegação: cabeçalho (AppHeader), menu lateral (NavDrawer) e rodapé
    shell/        Estrutura da aplicação: ClientLayout, tema, posição do menu e atalhos
    sobre/        Conteúdo e componentes da página "Sobre" (pessoas e link de conta)
  components/ui/  Componentes genéricos, sem domínio (botões, campos, diálogos, avisos,
                  abas, toasts, estados, LazyMount, marca e o efeito visual DitherVeil)
  hooks/          Hooks genéricos (snapshot do navegador, debounce, foco, mobile, compartilhar)
  lib/            Infraestrutura genérica (animações, navegação, versão, headers de segurança)
  content/        Artigos em Markdown (fonte do conteúdo)
  data/           Gerado por scripts/generate-catalog.js (não editar à mão)
  assets/styles/  CSS global e tokens de tema (Tailwind)
  tests/          Testes unitários (Vitest), agrupados por domínio
  proxy.ts        Proxy do Next (antigo middleware): atalho de login em /admin e /conta
e2e/              Testes ponta a ponta (Playwright)
scripts/          generate-catalog.js (gera o catálogo antes de dev e build)
docs/             Documentação
```

### Regras de dependência

- `app/` pode importar de qualquer lugar; nada importa de `app/`.
- `features/<x>` pode importar de `lib/`, `hooks/`, `components/ui/` e de outras features,
  sempre pelo módulo que define a responsabilidade (ex.: a chave de consentimento só vem de
  `features/consent/consent-storage.ts`).
- `lib/`, `hooks/` e `components/ui/` não importam de `features/`. Se algo genérico
  precisar de um domínio, ele pertence ao domínio. Foi por isso que a telemetria saiu de
  `lib/` para `features/analytics/`: ela depende do consentimento.
- Código só de servidor importa `server-only` (ex.: `features/auth/session.ts`,
  `user-actions.ts`, `users.ts`, `session-summary.ts`). O build falha se um componente de
  cliente importar um desses módulos.

---

## Responsabilidades dos módulos

| Módulo                                     | Responsabilidade                                                                                                                       |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `features/articles/catalog.ts`             | Converte o catálogo gerado (`src/data`) em `FAQ_DATA`, normaliza a categoria e aplica padrões (validade, revisão).                     |
| `features/articles/article-files.ts`       | Lê os `.md` direto do disco no servidor, para gerar e renderizar `/artigo/[id]`.                                                       |
| `features/articles/use-article-content.ts` | Carrega o conteúdo de um artigo sob demanda, converte Markdown em HTML, marca termos do glossário e sanitiza.                          |
| `features/articles/sanitize-html.ts`       | Sanitização única do HTML dos artigos (lista de tags e atributos permitidos).                                                          |
| `features/reading/*`                       | Lista de leitura (store compartilhada com `useSyncExternalStore`), meta de leitura, tipografia, destaques, recentes e trilhas.         |
| `features/search/*`                        | Índice MiniSearch sobre o catálogo e a paleta de comandos (Ctrl/⌘+K ou `/`).                                                           |
| `features/analytics/analytics-service.ts`  | Buscas sem resultado, feedback de artigos e leituras concluídas, guardados só no navegador. Só registra buscas com consentimento.      |
| `features/analytics/telemetry.ts`          | Sentry, iniciado só com consentimento e com o DSN configurado; não envia cookies nem headers.                                          |
| `features/consent/*`                       | Decisão de consentimento (`consent-storage.ts`), o contexto React, o banner e o modal de termos.                                       |
| `features/auth/*`                          | Configuração, verificação do JWT (JWKS), `/auth/me`, Server Actions de gestão, regras de usuário e nome, telas e componentes de conta. |
| `features/navigation/*`                    | Cabeçalho de vidro (`AppHeader`), menu lateral com módulos e artigos (`NavDrawer`), composição (`Sidebar`) e rodapé. Movimento em CSS. |
| `features/shell/*`                         | `ClientLayout` (composição, transição de página), botão de voltar ao topo, tema claro/escuro, posição do menu e atalhos globais.       |
| `features/auth/components/AccountMenu.tsx` | Menu de conta no cabeçalho: entrar/criar conta ou nome, papel, atalhos e sair. Sinal `data-session` usado pelos testes E2E.            |
| `app/@modal/(.)artigo/[id]`                | Rota interceptada: na navegação pelo site, o artigo abre em modal sobre a lista; acesso direto abre `/artigo/[id]` inteira.            |
| `app/**`                                   | Uma pasta por rota; componentes usados só por uma rota ficam junto dela (ex.: `app/admin/usuarios/UsersManager.tsx`).                  |

---

## Fluxos principais

**Conteúdo de artigos**

1. `npm run dev` e `npm run build` rodam antes o `scripts/generate-catalog.js` (scripts
   `predev`/`prebuild`).
2. O gerador lê `src/content/artigos/**/*.md` (frontmatter via gray-matter) e grava em
   `src/data/` o `catalog.json` (metadados, resumo e texto de busca) e o `mapping.ts`
   (conteúdo carregado sob demanda). A saída é a mesma em qualquer sistema operacional:
   ordem fixa e quebras de linha LF.
3. `features/articles/catalog.ts` expõe `FAQ_DATA`, usado pela home, pela busca, por "Minha
   lista" e pelo painel.
4. No modal da home, `use-article-content.ts` carrega o conteúdo, converte em HTML, aplica o
   glossário e sanitiza.
5. A página `/artigo/[id]` é gerada no build a partir de `article-files.ts`, que lê os `.md`
   direto do disco, e sanitiza no servidor.

**Autenticação.** Está detalhada em [docs/AUTENTICACAO.md](../../docs/AUTENTICACAO.md). Em resumo:

- `proxy.ts` manda para o login quem acessa `/admin` ou `/conta` sem o cookie de sessão.
- As páginas decidem o acesso no servidor (`requireSession` e `requireRole`), sempre
  consultando o papel atual em `/auth/me`.
- As Server Actions repetem a autorização antes de agir.
- Sem configuração `AUTH_*` válida, as rotas protegidas falham fechadas (`loadSessionDeps`): nada concede
  acesso, e o build não depende dessas variáveis.
- O navegador nunca lê os tokens: os cookies são HttpOnly e o JavaScript não tem acesso a
  eles.

**Consentimento.**

- O banner grava a decisão (`consent-storage.ts`).
- O `ClientLayout` inicia a telemetria quando o consentimento é concedido.
- As métricas de busca só são registradas com consentimento.

**Navegação e modal de artigo.**

- O cabeçalho fixo tem o botão do menu (módulos, "Sobre", alertas, LGPD e tema), o atalho para
  "Minha Lista" (com o número de itens salvos) e o menu de conta.
- Ao clicar num card, a grade navega para `/artigo/<id>`. Dentro do site, a rota interceptada
  `@modal/(.)artigo/[id]` mostra o artigo em modal (fechar = voltar). Abrindo o endereço
  direto, a página `/artigo/[id]` é renderizada inteira.
- Animações em CSS (`transform`/`opacity`); GSAP só em transições pontuais (modal, troca de página). Rolagem nativa do navegador.

**Tema.** O script inline de `app/layout.tsx` aplica o tema antes da hidratação, sem
"piscar". `use-theme-preference.ts` mantém e grava a preferência. Os dois usam a mesma chave
(`THEME_STORAGE_KEY`, em `features/shell/theme-storage.ts`, um módulo sem `'use client'` para poder ser lido pelo layout do servidor).

---

## Decisões arquiteturais

- **Organização por domínio (`features/`).**
  - Antes, o código era separado por tipo técnico (components, hooks, services, config,
    contexts), e vários módulos estavam no lugar errado: o catálogo de artigos ficava em
    `config/`, a grade e o modal de artigos em `components/layout`, busca e consentimento em
    `components/ui`.
  - Agrupar por domínio deixa junto o que muda junto.
  - `app/` ficou só com rotas, como pede o App Router.
- **Componentes de rota ficam com a rota.** Telas usadas por uma única página (gestão de
  usuários, formulários de login e cadastro) não viram "feature" à parte.
- **Uma fonte por chave de armazenamento.**
  - A chave de consentimento fica em `consent-storage.ts` e a do tema em
    `theme-storage.ts`.
  - Os nomes de eventos de leitura ficam em `READING_EVENTS`.
  - Antes, as mesmas strings estavam repetidas em vários módulos.
- **Catálogo pré-gerado.** O site não lê o disco em tempo de execução, exceto em
  `/artigo/[id]` durante o build.
  - Por isso `src/data` é versionado e gerado de forma determinística.
  - Esses arquivos ficam fora do Prettier (`.prettierignore`).

---

## Convenções

- **Imports:** `@/…` para outras pastas; `./…` só para arquivos da mesma pasta. Nada de
  `../`. Única exceção: arquivos fora de `src/` (ex.: `next.config.ts`).
- **Nomes de arquivo:**
  - componentes React em PascalCase (`ArticleModal.tsx`);
  - demais módulos em kebab-case (`use-reading-queue.ts`, `session-summary.ts`);
  - hooks começam com `use-`.
- **Dentro de uma feature:** componentes em `components/`; lógica (hooks, serviços, tipos,
  módulos de servidor) na raiz da feature.
- **Testes:** `src/tests/<domínio>/<assunto>.test.ts(x)` (Vitest + Testing Library); fluxos
  completos em `e2e/` (Playwright). Cobertura mínima de 70% em `vitest.config.ts`.
- **Comentários:** em português. Explicam o porquê (decisão, regra, limitação), não repetem
  o que o código diz.
- **Estilos:** use os tokens do tema (`bg-bg-island`, `text-text-muted`…) definidos em
  `src/assets/styles/global.css`. As classes vêm da detecção automática do Tailwind v4,
  sem `@source`.

---

## Configurações e dependências críticas

| Arquivo                | Para que serve                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `next.config.ts`       | Headers de segurança (CSP etc., `lib/security-headers.ts`), rewrites `/auth/*` e `/content/*` → AuthService e flags (`authInterrupts`). |
| `.env.local`           | Variáveis `AUTH_*` (só servidor). Exemplo em `.env.example`.                                                                            |
| `vitest.config.ts`     | Ambiente jsdom, alias `@/`, alias de `server-only` nos testes, limites de cobertura.                                                    |
| `playwright.config.ts` | Projetos desktop e mobile; sobe `npm run dev` se não houver servidor na porta 3000.                                                     |
| `eslint.config.mjs`    | Regras do Next; ignora `src/data/mapping.ts` (gerado).                                                                                  |

Dependências críticas:

- `jose`: verifica o JWT pelo JWKS do AuthService.
- `sanitize-html`: segurança do HTML dos artigos.
- `marked` e `gray-matter`: conversão de Markdown e leitura do frontmatter.
- `mermaid`: diagramas em blocos ```mermaid dos artigos (carregado sob demanda).
- `gsap` e `@gsap/react`: animações da interface; `ogl`: WebGL do efeito DitherVeil.
- `minisearch`: busca.
- `@sentry/react`: telemetria, só com consentimento.

---

## Manutenção

- **Novo artigo:** veja [INSERCAO_ARTIGOS.md](./INSERCAO_ARTIGOS.md).
- **Nova rota:** crie a pasta em `src/app/`. Lógica reaproveitável vai para a feature do
  domínio; o que só a rota usa fica junto dela.
- **Nova área de negócio:** crie `src/features/<nome>/` seguindo as convenções acima.
- **Antes de enviar:** rode `npm run check` (lint, tipos e testes) e `npm run build`. Os
  testes ponta a ponta precisam do AuthService (`npm run auth:up`) e das contas em
  `.env.e2e.local`.

---

## Problemas conhecidos

Comportamentos encontrados na refatoração e **mantidos como estão**, porque corrigi-los
muda o funcionamento. Cada um precisa de uma decisão própria. Os itens marcados como
resolvidos ficam na lista para manter a numeração.

1. **Tipografia não se atualiza no artigo aberto.** `ArticleContent` escuta
   `sst_reading_settings_updated`, que nada dispara. O serviço dispara
   `READING_EVENTS.typographyUpdated` (`sst_typography_updated`), que ninguém escuta.
2. **Remover destaque não atualiza a tela.** `removeHighlight` dispara o evento sem
   `detail.articleId`, e `ArticleContent` só recarrega quando o id vem no evento.
3. **Controles de leitura ignoram a prop recebida.** `ArticleReadingControls` não usa a
   prop `typography`: lê a preferência direto do serviço.
4. **Resumo diferente entre os dois caminhos de leitura.** O gerador do catálogo e
   `article-files.ts` calculam o texto puro e o resumo com regras um pouco diferentes. A
   descrição de `/artigo/[id]` pode diferir do resumo mostrado na home.
5. **Beacon para uma rota que não existe.** As métricas de busca enviam para
   `/api/track/search`, que não existe (404 silencioso). **Resolvido:** esse envio não existe mais no
   código.
6. **Dados de demonstração no painel.** Sem buscas registradas, `getSearchLogs` devolve
   exemplos fixos, e o painel mostra esses exemplos como se fossem dados reais. **Resolvido:**
   `getSearchLogs` foi removido.
7. **E2E instável em modo de desenvolvimento.** Com `npm run dev`, a primeira visita a cada
   página compila sob demanda e alguns fluxos estouram o tempo de 5 s. Contra o build de
   produção (`npm run start`), os testes passam. Mesmo em produção, com a máquina
   carregada, o teste "visitante acha Entrar / Cadastrar" falhou 1 vez em 7 execuções: o
   formulário de login ficou vazio no envio. Repetido isoladamente, passou.
8. **Enter na paleta de comandos abre o artigo errado.** Ao digitar, a seleção do teclado
   não vai para o primeiro resultado: continua no item selecionado antes da busca, se ele
   ainda estiver na lista. Ex.: busca "pgr", primeiro resultado "PGR", mas Enter abriu
   "A Estética do Feedback Contínuo". Clicar no resultado funciona. Continua igual na
   paleta nova vinda do GitHub.
9. **Exclusão de cobertura inócua.** `vitest.config.ts` exclui `src/test/`, mas a pasta se
   chama `src/tests/`, então essa exclusão não tem efeito.
10. **Conexão do proxy `/auth/*` reiniciada de vez em quando.** O log do Next registra
    "socket hang up" (ECONNRESET) ao repassar para o AuthService: o Node reaproveita uma
    conexão keep-alive que o servidor do AuthService acabou de fechar. A requisição afetada
    falha (a consulta de usuário mostra "não foi possível verificar"; um login mostraria
    "indisponível"). Correção sugerida: no AuthService, keep-alive maior que o do cliente
    (`--timeout-keep-alive` do uvicorn). **Resolvido:** o `Dockerfile` do AuthService usa
    `--timeout-keep-alive 75`.
11. **Corpo do artigo só no navegador.** Desde a versão do GitHub, `ArticleContent` devolve
    vazio na renderização do servidor e só monta o HTML depois da hidratação. Em
    `/artigo/[id]`, o título e os metadados vêm no HTML, mas o texto não (impacto em SEO e em
    leitores sem JavaScript).
12. **Testes do Vitest estourando 5 s de vez em quando.** **Resolvido em 2026-10-15:** o Vitest roda
    com metade dos núcleos (`maxWorkers: '50%'`); detalhes em [`docs/TESTES.md`](../../docs/TESTES.md).
13. **Erro de hidratação (React #418) nas páginas de artigo.** O `LazyMount` renderizava conteúdo
    diferente no servidor e no navegador. **Resolvido em 2026-10-15:** começa sempre pelo espaço
    reservado.

---

## Identidade visual: Liquid Glass

Tokens e materiais em `src/assets/styles/glass.css` (fonte única); os tokens do projeto
(`--bg-*`, `--text-*`, `--border`, fontes Inter/Playfair/Lexend) continuam valendo.
Paleta sóbria: grafite e neutros frios, com um único acento azul-aço.

**Materiais (por custo de renderização)**

| Material | Classes | Desfoque | Onde |
| --- | --- | --- | --- |
| Fundo | `.liquid-backdrop` | — | uma camada fixa e **estática** (malha + grão) |
| Superfície | `.glass`, `.glass-card`, `.glass-flat` | não | cards, painéis, bento, rodapé |
| Cromo | `.glass-strong`, cabeçalho, menu | sim | só o que fica sobre conteúdo em movimento |
| Leitura | `.reading-surface` | — | corpo do artigo (quase opaca, contraste AA) |

**Navegação** (`src/features/navigation/`): `Sidebar` compõe `AppHeader` (cabeçalho
flutuante: menu, marca, busca, alertas, tema, Minha Lista, conta) e `NavDrawer` (menu
lateral: módulos com contagem, artigos de cada módulo, atalhos). Estilos em `nav.css`. O
módulo ativo vem da URL, então menu e pílulas da página inicial sempre concordam.

**Leitura:** `ArticleHero` (cabeçalho), `ArticleReader` (página) e `ArticleModal`
(modal), com índice, progresso (`useReadingProgress`, escreve no DOM sem re-renderizar),
dock de ações e anterior/próximo do módulo (`ArticleNeighbors`).

**Regras de desempenho** (medidas com `node scripts/perf-probe.mjs`, ver abaixo)

1. Nada anima sob vidro desfocado: o fundo é estático. (Fundo animado: página ociosa caía
   para ~20 fps com renderização por software.)
2. Vidro desfocado não se move: o menu aparece por opacidade e o conteúdo dele é que
   desliza. (Vidro em movimento: quadros de 70–100 ms ao abrir.)
3. Desfoque aninhado não alcança a página: popovers dentro do cabeçalho usam vidro quase
   opaco.
4. Só `transform`/`opacity` em movimento; estados por atributos `data-*`; listeners de
   rolagem passivos, um quadro por vez, tocando o DOM só quando o estado muda.
5. Rolagem nativa (sem biblioteca de rolagem suave): roda no compositor e responde na hora.
6. Modo lite (`html[data-glass='lite']`): aparelhos com ≤2 núcleos ou ≤2 GB, Save-Data ou
   transparência reduzida. `prefers-reduced-motion` desliga as animações.

**Sonda de desempenho:** `node scripts/perf-probe.mjs [url]` mede quadros, quadros longos
e trabalho do navegador (layouts, estilo, script) em: ocioso, abrir o menu, rolar, buscar,
abrir e rolar um artigo. `PERF_GPU=1` usa a GPU real; `PERF_CSS="..."` injeta CSS para
isolar o custo de um efeito.

**Busca:** fica no cabeçalho (`HeaderSearch`): a lupa expande um campo com resultados
imediatos (combobox WAI-ARIA); "Busca completa" abre a paleta (Ctrl+K).

---

## Design system

Tokens em `src/assets/styles/glass.css` (paleta, materiais, raios, sombras, movimento) e, desde a refatoração de UX, também:

| Token | Uso |
| --- | --- |
| `--tone-info/success/warning/danger` e `-bg` | Avisos, selos e estados (contraste AA nos dois temas) |
| `--measure-reading` | Largura confortável de leitura (68ch) |
| `--space-page` | Respiro lateral fluido das páginas |
| `--control-h`, `--control-h-sm` | Altura de controles (44px de alvo de toque) |

Componentes de interface: classes em `src/assets/styles/ui.css` (`ui-btn`, `ui-input`, `ui-alert`, `ui-badge`, `ui-tabs`, `ui-dialog`, `ui-toast`, `ui-table`, `ui-state`, `ui-skeleton`) e componentes React em `src/components/ui`:

- `Logo` / `LogoMark` — marca própria em SVG (escudo com verificação), cores do tema.
- `Button` / `ButtonLink` — variantes primary, secondary, ghost, danger; `loading` trava o clique.
- `Field` — rótulo, ajuda e erro ligados ao controle (`aria-describedby`, `aria-invalid`).
- `Alert`, `EmptyState`, `ErrorState`, `Skeleton` (estático), `StatusPage` (404/403/erros).
- `Tabs` (padrão WAI-ARIA, setas/Home/End), `Dialog` / `ConfirmDialog` (`<dialog>` nativo), `ToastProvider` / `useToast` (região `aria-live`).
- `LazyMount` — monta seções pesadas no primeiro momento ocioso ou quando se aproximam da tela.

Efeitos visuais: automático, completo ou reduzido (`src/features/shell/glass-preference.ts`), escolhidos em Minha conta (Preferências); a escolha manual vence a detecção automática do modo lite.

---

## Interações com os artigos

Avaliação, **Sugerir correção** e comentários são gravados no AuthService (ADR-0015, rotas `/content/*`, repassadas pelo `next.config.ts` como `/auth/*`). O cliente é `src/features/content/content-client.ts` (usa `authFetch`: renova o access uma vez se vencer).

- Leitura pública (média, comentários); escrever exige sessão. Papéis vêm do banco.
- Sugestões entram na fila "Sugestões de correção" do painel (editor e admin) e o andamento aparece em Minha conta.
- Comentários: texto puro, até 2000 caracteres e 2 links, respostas com um nível, edição pela autoria, remoção pela autoria ou pela moderação (aba "Comentários" do painel). Repetição e excesso de envios são recusados pelo servidor.
- O editor do painel não grava: monta o arquivo Markdown com frontmatter para o pull request (o conteúdo vive no repositório).
- Metadados do artigo só aparecem quando declarados no frontmatter (`author`, `verifiedBy`, `lastReviewed`); nada é preenchido com valores padrão.

### Desempenho medido (refatoração de UX)

`node scripts/perf-probe.mjs` com `PERF_GPU=1` (GTX 1660 SUPER), média de 4 rodadas, versão anterior (`50fd1b5`) × atual:

| Cenário | Antes (fps) | Depois (fps) | Observação |
| --- | --- | --- | --- |
| Ocioso | 60 | 60 | |
| Abrir menu | 49–58 | 51–57 | |
| Rolar a página inicial | 55–57 | 55–57 | |
| Busca | 59–60 | 60 | índice do Ctrl+K não é mais refeito a cada render |
| Abrir artigo | 32–48 (pior quadro 366–602 ms) | 42–47 (pior quadro 197–298 ms) | cabeçalho do modal sem desfoque enquanto a folha se move |
| Rolar artigo | 44–52 | 41–52 | seções finais com `content-visibility` e borda sem máscara |

A sonda passou a abrir o primeiro **card** da lista: antes ela clicava no primeiro link de artigo da página, que deixou de ser um card.
