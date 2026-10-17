# ADR-0017: Monorepo, BaseCore e AuthService no mesmo repositório

- Status: aceito
- Data: 2026-10-15

## Contexto

A Base de Conhecimento (Next.js) e o AuthService (FastAPI) viviam em repositórios separados, lado a lado na
mesma pasta (`../AuthService`). A Base depende do AuthService inteiro (login, contas, papéis e as interações
dos artigos, ADR-0015), e o trabalho do AuthService existia só como commits locais, sem cópia remota.

## Decisão

- Um repositório só, o da Base (`VictorCardosoOl/Base_de_Conhecimento`), com uma pasta por serviço:
  - `BaseCore/`: a Base de Conhecimento, movida da raiz;
  - `AuthService/`: o serviço de identidade e de interações;
  - `deploy/`: exemplos de proxy de borda para a implantação do conjunto;
  - `docs/`: documentação e decisões que valem para os dois serviços (a partir deste ADR).
- **Continuam dois serviços separados**, cada um com processo, banco de dados (só o AuthService tem banco),
  testes, `Dockerfile`, dependências e `.env.example` próprios. A BaseCore conversa com o AuthService só por
  HTTP (`/auth/*`, `/content/*`, `/auth/me`, JWKS e a API administrativa), como no ADR-0001.
- **O AuthService entra só como árvore de arquivos, sem o histórico.** O histórico do projeto de origem tem
  um `.env` com `SECRET_KEY` (commits `1cd4e7b` e `fdf1396`). Trazer o histórico publicaria esse arquivo
  aqui. A chave não é usada pelo código atual (tokens EdDSA, ADR-0002).
- `docker-compose.yml` na raiz sobe tudo; ele inclui o compose do AuthService (`include`), que continua
  funcionando sozinho (usado por `npm run dev:all` na BaseCore).
- CI por serviço, com filtro por caminho: `ci-quality-gates.yml` (BaseCore), `ci-authservice.yml` e
  `codeql.yml` (AuthService).
- Numeração dos ADRs: os ADRs 0001 a 0016 continuam em `AuthService/docs/adr/`; os novos, que valem para o
  projeto inteiro, seguem a numeração em `docs/adr/` ([índice](./README.md)).

## Alternativas consideradas

- **Manter dois repositórios.** Exigiria publicar o AuthService num repositório próprio e coordenar versões
  e PRs entre os dois a cada mudança que atravessa os serviços (quase todas na autenticação). Descartada:
  o trabalho do AuthService estava só local, e a equipe é a mesma.
- **Juntar os dois num serviço só** (API dentro do Next). Exigiria reescrever o AuthService em TypeScript e
  misturar a identidade com o site. Descartada: o AuthService já é testado e isolado, e manter a identidade
  num serviço próprio segue o ADR-0001.
- **Trazer o AuthService com o histórico** (subtree ou reescrita de caminhos). Descartada pelo `.env` com
  `SECRET_KEY` no histórico de origem. O histórico local completo continua guardado num bundle de backup,
  fora do repositório.

## Consequências

- Uma mudança que atravessa os dois serviços vai num commit só, e o CI de cada lado roda quando a pasta dele
  muda.
- O compose da raiz usa, por padrão, `AUTH_ISSUER=http://localhost:8010`, `AUTH_AUDIENCE=knowledge-api` e
  `AUTH_ACCESS_COOKIE_NAME=kb_at`, os mesmos valores do `AuthService/.env.example` (`AUTH_PORT=8010`,
  `JWT_ISSUER=http://localhost:8010`, `JWT_AUDIENCE=knowledge-api`, `ACCESS_COOKIE_NAME=kb_at`).
- Subir pela raiz e subir só o AuthService (pela BaseCore) criam projetos do Docker diferentes, cada um com o
  próprio banco local.
- `AuthService/frontend/` e `AuthService/read-model/` continuam: o primeiro é a interface de demonstração
  servida pelo próprio AuthService (ADR-0007) e o segundo guarda imagens, a licença e guias usados no README
  dele.
- O histórico do AuthService anterior ao monorepo não fica no repositório; quem precisar dele usa o backup.
