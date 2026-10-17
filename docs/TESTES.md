# Testes

Como testar cada serviço, o que cada suíte cobre e as instabilidades conhecidas. Os números de
referência têm data: confira de novo antes de citar.

## Visão geral

| Suíte | Serviço | Ferramenta | Precisa de |
| --- | --- | --- | --- |
| Unidade e integração da API | AuthService | pytest | PostgreSQL de teste |
| Lint e formatação | AuthService | ruff | nada |
| Tipos | AuthService | mypy | nada |
| Unidade e componentes | BaseCore | Vitest (jsdom) | nada |
| Lint | BaseCore | ESLint | nada |
| Tipos | BaseCore | TypeScript (`tsc`) | nada |
| Build de produção | BaseCore | `next build` | nada (passa com e sem as variáveis `AUTH_*`) |
| Ponta a ponta (E2E) | BaseCore com AuthService | Playwright | os dois serviços no ar e contas de teste |

## AuthService

Na pasta `AuthService/`, com o ambiente Python do serviço ativo (`pip install -r requirements-dev.txt`):

```bash
ruff check backend migrations tests
ruff format --check backend migrations tests
mypy
pytest
```

- O pytest roda contra um **PostgreSQL real**, indicado por `TEST_DATABASE_URL`. Sem ela, o pytest para
  com "Defina TEST_DATABASE_URL apontando para um PostgreSQL de teste.". O schema `auth` desse banco é
  recriado a cada execução: **nunca aponte para o banco de desenvolvimento**.
- Um banco de teste descartável em container:

  ```bash
  docker run -d --name authservice-testdb -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=authservice_test -p 127.0.0.1:15432:5432 postgres:18
  export TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:15432/authservice_test
  ```

- O que cobre: login e limites de tentativas, sessões e refresh (inclusive concorrência), tokens e JWKS,
  cookies, CSRF e cabeçalhos, gestão de usuários e papéis, cadastro e pedidos de editor, recuperação de
  senha e confirmação de email, login social (provedores simulados), interações de conteúdo, termos,
  configuração e o contrato OpenAPI (`docs/openapi.json`, regenerado com
  `python -m backend.scripts.export_openapi` quando a API muda).
- `tests/test_auditoria_autenticacao.py` reúne as regressões da auditoria de autenticação.

## BaseCore

Na pasta `BaseCore/`, depois de `npm ci`:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

- `npm run check` roda lint, tipos e testes de uma vez.
- `npm run test:coverage` mede a cobertura. O mínimo é 70% de linhas, funções, ramos e comandos
  (`vitest.config.ts`); o número só sobe.
- O que cobre: autenticação no cliente e no servidor (sessão, papéis, renovação, proteção contra loop),
  telas de login, cadastro, troca de senha e conta, painel administrativo, artigos e leitura, busca,
  interações (avaliação, correção, comentários), consentimento de cookies, páginas institucionais,
  navegação e tema.
- O build roda antes `npm run catalog` (gera `src/data/catalog.json` e `src/data/mapping.ts` a partir dos
  artigos).
- Critério fixo: o build passa **sem nenhuma variável `AUTH_*` e sem `.env`**, como no CI
  (`ci-quality-gates.yml` não define essas variáveis) e na Vercel. As páginas protegidas e `/api/session`
  são dinâmicas e leem a configuração só em tempo de requisição; sem ela, falham fechadas
  (`src/tests/auth/authConfigMissing.test.ts`). Para conferir localmente, construa numa cópia sem
  `.env.local` e sem as variáveis no ambiente. A lista de rotas deve ser a mesma do build com as variáveis.

## E2E (Playwright)

Precisa da BaseCore e do AuthService no ar e das contas de teste.

1. Suba a pilha: pela raiz (`docker compose up -d --build`) ou só o AuthService (`npm run auth:up` na
   pasta `BaseCore/`) e a BaseCore com `npm run build` e `npm run start`.
2. Crie `BaseCore/.env.e2e.local` (não versionado) com as contas de teste do AuthService local:
   `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `E2E_EDITOR_EMAIL`, `E2E_EDITOR_PASSWORD`, `E2E_USER_EMAIL`,
   `E2E_USER_PASSWORD`. Use as mesmas contas criadas por `SEED_DEV_USERS=true` no `AuthService/.env`.
   Nunca use credenciais reais.
3. Na pasta `BaseCore/`, com essas variáveis carregadas no ambiente:

   ```bash
   npm run test:e2e -- --project=chromium
   ```

- Sem as contas, os fluxos com login são pulados e o resto roda.
- Ao terminar, `e2e/global-teardown.ts` apaga as contas que os testes criam
  (`python -m backend.cli delete-e2e-users`, só com `SEED_DEV_USERS=true`), procurando o AuthService em
  `../AuthService` (ou em `E2E_AUTHSERVICE_DIR`). Com a pilha subida pelo compose da raiz, defina
  `E2E_AUTHSERVICE_DIR` com o caminho da raiz do repositório, onde está o `docker-compose.yml` que tem o
  serviço `auth-service`.
- O projeto `mobile-chrome` roda os testes de tela pequena (`e2e/mobile-ux.spec.ts`); no projeto
  `chromium` eles aparecem como pulados, de propósito.
- Os snapshots visuais (`e2e/visual-regression.spec.ts`) dependem do sistema operacional: as referências
  versionadas são de Windows (`*-win32.png`).

## Instabilidades conhecidas e por quê

| Sintoma | Causa | Situação |
| --- | --- | --- |
| Vitest: um teste diferente a cada vez estoura 5 s | Paralelismo acima dos núcleos: cada worker monta o próprio jsdom e a CPU satura | Resolvido em 2026-10-15: `maxWorkers: '50%'` em `vitest.config.ts`. Sem aumentar timeout nem usar retry |
| E2E: renovação silenciosa ou análise de acessibilidade passam do tempo na suíte completa | Next, AuthService, Docker e o navegador disputando a mesma máquina | Mitigado: 2 workers locais (1 no CI). Os mesmos testes passam isolados |
| E2E: tentativas espalhadas pela virada do minuto não dão `429` na 6ª | Limite em janela fixa | Esperado; ver [AUTENTICACAO.md](./AUTENTICACAO.md#limites-de-tentativas) |

Para investigar um teste instável, rode só o arquivo dele e, depois, a suíte completa várias vezes,
guardando o relatório JSON (`--reporter=json`) de cada execução.

## Números de referência

Medidos de 2026-10-15 a 2026-10-17, numa máquina Windows de 8 núcleos, na estrutura do monorepo.

| Suíte | Resultado |
| --- | --- |
| pytest (AuthService, 2026-10-16) | 301 passaram, cobertura de 97% |
| ruff e mypy (AuthService) | sem problemas (58 arquivos no mypy) |
| Vitest (BaseCore, 2026-10-17) | 502 passaram em 44 arquivos, cerca de 90 s |
| tsc (BaseCore) | 0 erros |
| ESLint (BaseCore) | 0 erros e 16 avisos |
| `next build` (BaseCore, 2026-10-17) | 90 páginas estáticas, com e sem as variáveis `AUTH_*` (mesma lista de rotas) |
| E2E chromium (2026-10-17, pilha do compose da raiz) | 58 passaram e 7 pulados (só para celular) |
