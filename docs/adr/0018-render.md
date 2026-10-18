# ADR-0018: Hospedagem na Render, um serviço por pasta, no plano gratuito

- Status: proposto
- Data: 2026-10-17

## Contexto

O monorepo (ADR-0017) tem dois serviços que precisam ir ao ar juntos: a BaseCore (Next.js) e o AuthService
(FastAPI com PostgreSQL). A versão publicada hoje é só a Base antiga, na Vercel, sem login. A hospedagem do
conjunto precisa:

- rodar um contêiner Python com banco, o que a Vercel não oferece para o AuthService;
- custar zero, em todos os recursos;
- aceitar um serviço novo no futuro sem reorganizar o repositório.

## Decisão

- **Render**, descrita por um Blueprint na raiz (`render.yaml`), com **um Web Service Docker por pasta**:
  `rootDir: BaseCore` e `rootDir: AuthService`, cada um com o próprio `Dockerfile` e `buildFilter`. Um serviço
  novo é um bloco novo no `render.yaml`.
- **Plano gratuito em tudo.** Nenhum recurso pago e nenhum upgrade. Quando um recurso só existe no plano pago,
  registra-se a alternativa gratuita e a limitação ([DEPLOY.md](../DEPLOY.md)).
- **Postgres gratuito da Render**, definido no Blueprint (`plan: free` explícito) e ligado ao AuthService por
  referência (`fromDatabase`, URL interna). Sem acesso externo por padrão (`ipAllowList: []`). Como só um
  Postgres gratuito é permitido por workspace, a vaga é liberada antes da criação.
- **Mesma região (Oregon)** para os serviços e o banco: a URL interna exige a mesma região, e a região não
  muda depois de criada.
- **Consequências do plano gratuito, aceitas para o teste:**
  - o AuthService fica **público**, porque o plano gratuito não tem Private Service e o serviço gratuito não
    recebe tráfego privado. A BaseCore o chama pela URL pública;
  - `TRUSTED_PROXY_COUNT=0`, porque qualquer valor acima de zero, com o AuthService público, permite forjar o
    IP chegando direto nele. Os limites por IP viram um limite global (risco F1, já registrado);
  - as migrations rodam no comando de início do AuthService (`dockerCommand`), porque o pre-deploy é pago;
  - sem Cron Job (pago): o `purge-expired` roda manualmente;
  - sem Shell (pago): o primeiro administrador e as tarefas de operação rodam de uma máquina local contra a URL
    externa do banco;
  - sem SMTP: a Render bloqueia as portas 25, 465 e 587 nos serviços gratuitos. O AuthService sobe com
    `EMAIL_BACKEND=disabled` até existir um adaptador de envio por HTTPS.
- **Deploy a partir de URL pública do repositório**, sem fork e sem conectar a conta do GitHub. A Render não
  faz deploy automático nesse modo: cada deploy é manual (painel ou Deploy Hook).

## Alternativas consideradas

- **Vercel para a BaseCore e outro provedor para o AuthService.** Dois provedores, duas configurações e a
  BaseCore chamando o AuthService pela internet do mesmo jeito. Descartada para o teste; pode voltar a ser
  avaliada para a BaseCore, que já roda na Vercel.
- **Fly.io, Railway ou Koyeb.** Não avaliadas em detalhe. A Render já é usada no workspace da equipe, que
  tem acesso configurado a ela.
- **VPS própria com o compose da raiz e o Caddy** (`deploy/`). É a topologia mais segura (AuthService sem
  acesso público e `TRUSTED_PROXY_COUNT` medido), mas tem custo. Fica como caminho para produção.
- **Plano pago da Render** (Private Service, pre-deploy, Shell, Cron Job). Resolve as limitações acima, mas
  contraria a regra de custo zero.

## Consequências

- O AuthService aceita conexões diretas da internet. Isso é o que o roteiro de implantação
  (`AuthService/docs/IMPLANTACAO.md`, seções 4 e 7) manda evitar em produção; aqui é aceito só para o teste
  gratuito, com `TRUSTED_PROXY_COUNT=0`.
- Serviços gratuitos dormem após 15 minutos sem tráfego e levam cerca de um minuto para acordar. O primeiro
  login depois de um período parado pode falhar com "indisponível" enquanto o AuthService acorda.
- O Postgres gratuito expira 30 dias após a criação (mais 14 de carência), tem 1 GB e não tem backup. Os dados
  do teste são descartáveis; para uso real, migra-se com `pg_dump` e `pg_restore` ([DEPLOY.md](../DEPLOY.md)).
- As 750 horas gratuitas por mês são do workspace inteiro, divididas com os outros serviços gratuitos dele.
  Se acabarem, todos os serviços gratuitos do workspace ficam suspensos até o mês seguinte.
- Uma mudança no `render.yaml` só vale para serviços novos ou para uma nova sincronização do Blueprint; os
  valores com `sync: false` nunca são lidos do arquivo.
