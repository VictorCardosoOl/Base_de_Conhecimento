<div align="center">

![](https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=header)

# 🔐 AuthService

**Provedor de identidade e de interações da Base de Conhecimento SST: FastAPI, PostgreSQL, JWT EdDSA e sessões com refresh token rotativo.**

[![Licença](https://img.shields.io/badge/Licença-MIT-4ade80?style=for-the-badge)](./read-model/LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./Dockerfile)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.141-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)

</div>

---

<div align="center">
  <img src="./read-model/img/Banner.png" alt="Banner AuthService" width="100%"/>
</div>

---

## 🌐 Demonstração

<div align="center">

| Item | Endereço |
| --- | --- |
| 🔗 **Aplicação** | [authservice-mbul.onrender.com](https://authservice-mbul.onrender.com) |
| 📖 **API Docs** | [authservice-mbul.onrender.com/docs](https://authservice-mbul.onrender.com/docs) |
| 📡 **Health Check** | [authservice-mbul.onrender.com/health](https://authservice-mbul.onrender.com/health) |
| ⚠️ **Aviso** | Demonstração publicada pelo projeto de origem, anterior a esta versão: não reflete o código deste repositório e pode estar fora do ar. No plano gratuito do Render, a primeira requisição pode levar até **50 segundos**. |

</div>

---

## 📌 O que é este projeto?

O **AuthService** é o provedor de identidade da Base de Conhecimento: autentica usuários, mantém sessões persistentes e emite tokens que outros serviços validam **apenas com a chave pública**.

- Usuários, sessões e refresh tokens persistidos em **PostgreSQL** (schema `auth`, ids UUID).
- **Access token JWT EdDSA (Ed25519)** de vida curta, com `sub`, `iss`, `aud`, `jti`, `role` e `sid`.
- **Refresh token opaco e rotativo**; reapresentar um token já usado revoga a sessão inteira.
- Tokens entregues **somente em cookies HttpOnly**, nunca no corpo das respostas nem acessíveis ao JavaScript.
- **Cadastro público opcional** (`PUBLIC_REGISTRATION_ENABLED`, desligado por padrão): a conta nasce sempre `user`; promoção a editor só por admin/editor, a partir de um pedido do usuário (ADR-0010).
- **Interações dos artigos** (rotas `/content/*`): avaliações, sugestões de correção e comentários, no mesmo banco (ADR-0015).

Neste repositório, o AuthService fica na pasta `AuthService/`, ao lado da Base de Conhecimento (`BaseCore/`). Visão do conjunto: [README da raiz](../README.md). Como a autenticação funciona de ponta a ponta: [`docs/AUTENTICACAO.md`](../docs/AUTENTICACAO.md).

As decisões de arquitetura estão registradas em [`docs/adr/`](./docs/adr) (índice em [`../docs/adr/README.md`](../docs/adr/README.md)).

---

## ✨ Funcionalidades

- Login com **Argon2id**, mensagem única para email inexistente e senha incorreta, e tempo de resposta equivalente nos dois casos
- **Rate limiting** de login por IP, por IP + email e por conta, compartilhado entre instâncias (PostgreSQL); só as tentativas que falham contam (ADR-0016)
- **Refresh rotativo com detecção de reuso** (com janela de 10 s para abas concorrentes), logout idempotente e encerramento de todas as sessões
- Papéis `admin`, `editor` e `user`, com a autorização verificada **no servidor**, a partir do banco; troca de senha temporária imposta no servidor (`403 PASSWORD_CHANGE_REQUIRED`)
- Recuperação de senha e confirmação de email por links de uso único; login social com Google e GitHub (OAuth 2.0 com PKCE)
- **JWKS** (`/.well-known/jwks.json`) com suporte a rotação de chaves sem downtime
- Defesa **CSRF** por `Origin`/`Referer`, além de `SameSite=Lax`; CORS desligado por padrão
- Headers de segurança, erros padronizados (`{"error": {"code", "message"}}`) e logs sem segredos
- Contrato **OpenAPI** versionado em [`docs/openapi.json`](./docs/openapi.json), verificado no CI
- Frontend de demonstração (tema terminal dark/light) usando o mesmo fluxo por cookies

---

## 🖼️ Preview

<div align="center">
  <img src="./read-model/img/Login01.png" alt="Tela de Login" width="100%"/>
  <br/><sub>Tela de Login — autenticação via credenciais</sub>
</div>

<br/>

| Login preenchido | Cadastro |
| --- | --- |
| ![Login preenchido](./read-model/img/Login02.png) | ![Cadastro](./read-model/img/Cadastro01.png) |

<br/>

| Dashboard autenticado | Sessão não encontrada |
| --- | --- |
| ![Dashboard](./read-model/img/Home01.png) | ![Sem sessão](./read-model/img/Home02.png) |

<br/>

<div align="center">
  <img src="./read-model/img/Status.png" alt="Painel de Status da API" width="100%"/>
  <br/><sub>Painel de Status — monitoramento de endpoints em tempo real</sub>
</div>

---

## 🧩 Páginas do frontend

### 🔑 Login (`index.html`)

Formulário com **toggle animado em CSS puro**. O painel alternativo explica o **acesso por convite**: a interface de demonstração não oferece cadastro, mesmo quando o cadastro público da API está ligado. O login chama `POST /auth/login`, e o servidor responde com cookies HttpOnly: a página não lê nem guarda tokens ou senhas.

### 🏠 Dashboard (`home.html`)

Dados do usuário obtidos em `/auth/me` (id, email e papel), status da sessão, **logout** e **encerrar todas as sessões**. Quando o access token expira, a página renova a sessão uma única vez via `/auth/refresh`.

### 📡 Status da API (`status.html`)

Monitoramento de `/health` e `/auth/me` com latência, descrição de `/auth/login` e `/auth/refresh`, e log em estilo terminal.

---

## 🛠️ Tecnologias utilizadas

**Backend:** FastAPI · Pydantic v2 · pydantic-settings · SQLAlchemy 2 · Alembic · psycopg 3 · PyJWT (EdDSA) · cryptography · argon2-cffi · Uvicorn

**Qualidade:** pytest (contra PostgreSQL real) · ruff · mypy `--strict` · cobertura mínima de 85% · gitleaks · CodeQL

**Frontend:** HTML5, CSS3 e JavaScript puros · JetBrains Mono + Syne · Font Awesome

**Infraestrutura:** Docker (usuário não-root) · Docker Compose (PostgreSQL + job de migrations + serviço) · GitHub Actions

---

## 🗂️ Estrutura de arquivos

```text
AuthService/
├── backend/
│   ├── api/                → rotas (auth, admin, sistema), cookies, middlewares, erros
│   ├── core/               → config, banco, tokens (EdDSA/JWKS), senhas, rate limit, logs
│   ├── dependencies/       → identidade atual, exigência de papel, IP do cliente
│   ├── models/             → tabelas SQLAlchemy (schema auth)
│   ├── repositories/       → acesso a dados
│   ├── schemas/            → DTOs de entrada e saída
│   ├── services/           → regras de autenticação e de usuários
│   ├── scripts/            → geração de chaves, exportação do OpenAPI
│   ├── cli.py              → create-user, purge-expired, seed-dev-users, delete-e2e-users
│   └── main.py             → fábrica da aplicação
├── migrations/             → migrations Alembic
├── tests/                  → testes de integração (PostgreSQL real)
├── docs/
│   ├── adr/                → decisões de arquitetura
│   └── openapi.json        → contrato da API
├── frontend/               → interface de demonstração (servida em "/" pelo próprio serviço)
├── read-model/            → imagens do README, licença e guias do projeto de origem
├── Dockerfile · docker-compose.yml · alembic.ini · pyproject.toml
└── requirements.txt · requirements-dev.txt · .env.example
```

---

## 🎨 Sistema de design

O frontend utiliza um **design system** com tokens CSS completos para dois temas:

| Token | Tema Escuro | Tema Claro |
| --- | --- | --- |
| Background | `#0d0e11` | `#f0f1f3` |
| Surface | `#181b21` | `#ffffff` |
| Texto primário | `#e2e8f0` | `#111827` |
| Accent | `#4ade80` — verde neon | `#166534` — verde escuro |
| Danger | `#f87171` | `#dc2626` |
| Warning | `#fbbf24` | `#d97706` |
| Border | `#2a2e38` | `#d1d5db` |
| Grid de fundo | `rgba(255,255,255,0.025)` | `rgba(0,0,0,0.035)` |

O grid terminal de fundo é gerado via `background-image` com `linear-gradient` — sem imagens externas.

---

## 📡 Endpoints da API

Documentação interativa em **`/docs`** (desligável com `OPENAPI_ENABLED=false`). O contrato completo está em [`docs/openapi.json`](./docs/openapi.json).

| Método | Rota | Autenticação | Descrição |
| --- | --- | --- | --- |
| `POST` | `/auth/login` | — | Valida credenciais, cria sessão e define os cookies |
| `POST` | `/auth/refresh` | cookie de refresh | Rotaciona o refresh token e emite novo access token |
| `POST` | `/auth/logout` | — (idempotente) | Revoga a sessão atual e limpa os cookies |
| `POST` | `/auth/logout-all` | sessão | Revoga todas as sessões do usuário |
| `POST` | `/auth/register` | — (se `PUBLIC_REGISTRATION_ENABLED`) | Cadastro público (email, senha, usuário, nome, aceite dos termos e perfil opcional): conta sempre `user`; já abre a sessão e envia a confirmação do email |
| `GET` | `/auth/username-available?username=` | — (limite por IP) | Prévia de disponibilidade do usuário: `{available, reason}` (`invalid`, `reserved` ou `taken`) |
| `POST` | `/auth/password` | sessão | Troca a própria senha (exige a atual); encerra as demais sessões |
| `POST` | `/auth/role-request` | sessão (`user`) | Pede acesso de editor (um pendente por vez) |
| `GET` | `/auth/role-request` | sessão | Situação do último pedido |
| `GET` | `/auth/me` | sessão | `{id, email, username, display_name, role, must_change_password, email_verified, has_password}` |
| `POST` | `/auth/password/forgot` | — (limite por IP e email) | Pede o link de redefinição; resposta sempre igual (202), exista ou não a conta |
| `POST` | `/auth/password/reset` | link do email | Define a nova senha (uso único); encerra todas as sessões |
| `POST` | `/auth/email/verify` | link do email | Confirma o email |
| `POST` | `/auth/email/verification` | sessão | Reenvia o link de confirmação |
| `GET` | `/auth/oauth/providers` | — | Provedores sociais configurados |
| `GET` | `/auth/oauth/{provedor}/start` · `/callback` | — (navegação) | Login social com `state` + PKCE (ADR-0013) |
| `GET` | `/auth/oauth/pending` | cookie do cadastro social | Email e sugestões do cadastro social pendente |
| `POST` | `/auth/oauth/complete` · `/pending/cancel` | cookie do cadastro social | Conclui (usuário, nome, termos) ou desiste do cadastro social |
| `GET` | `/admin/users?q=` | papel `admin` | Lista usuários (paginado); `q` busca em usuário, nome e email |
| `POST` | `/admin/users` | papel `admin` | Cria usuário (email, senha inicial, usuário, nome e papel; troca de senha obrigatória no 1º acesso) |
| `PATCH` | `/admin/users/{id}` | papel `admin` | Altera papel e/ou ativação; revoga as sessões do usuário |
| `POST` | `/admin/users/{id}/password` | papel `admin` | Redefine a senha (temporária) e revoga as sessões do usuário |
| `GET` | `/admin/role-requests` | `admin` ou `editor` | Pedidos pendentes de acesso de editor |
| `POST` | `/admin/role-requests/{id}/approve` · `/reject` | `admin` ou `editor` | Aprova (vira editor; sessões revogadas) ou recusa |
| `GET` | `/.well-known/jwks.json` | — | Chaves públicas para validar access tokens |
| `GET` | `/health` | — | Status do serviço e do banco (`503` quando o banco não responde) |

As rotas de interações dos artigos (`/content/*`) estão no contrato OpenAPI e no [ADR-0015](./docs/adr/0015-avaliacoes-correcoes-e-comentarios.md).

Papéis: `admin` (gerencia usuários e conteúdo), `editor` (conteúdo; aprova pedidos de acesso de editor) e `user` (consulta). Regras em [ADR-0009](./docs/adr/0009-gestao-de-usuarios-e-papel-editor.md) e [ADR-0010](./docs/adr/0010-cadastro-publico-e-pedidos-de-editor.md). Usuário (único) e nome de exibição: [ADR-0011](./docs/adr/0011-usuario-e-nome-de-exibicao.md). Recuperação de senha, confirmação de email e nomes reservados: [ADR-0012](./docs/adr/0012-recuperacao-de-senha-e-confirmacao-de-email.md). Login social: [ADR-0013](./docs/adr/0013-login-social-oauth.md). Termos e perfil opcional: [ADR-0014](./docs/adr/0014-termos-de-uso-e-perfil-opcional.md).

**Usuários de teste (só desenvolvimento):** com `SEED_DEV_USERS=true` no `.env`, o `docker compose up` cria um admin, um editor e um user, com os usuários `admin`, `editor` e `leitor` (credenciais `SEED_*` do `.env.example`). Em produção a configuração é rejeitada.

"Sessão" = cookie de access token **ou** `Authorization: Bearer` (clientes não-navegador). Erros sempre seguem o formato `{"error": {"code": "...", "message": "..."}}`, com os códigos `VALIDATION_ERROR`, `INVALID_TOKEN`, `INVALID_CREDENTIALS`, `UNAUTHORIZED`, `SESSION_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `METHOD_NOT_ALLOWED`, `CONFLICT`, `RATE_LIMITED`, `PASSWORD_CHANGE_REQUIRED`, `SERVICE_UNAVAILABLE` e `INTERNAL_ERROR` (`backend/core/errors.py`).

### Cookies

| Cookie (produção) | Conteúdo | Atributos |
| --- | --- | --- |
| `__Host-kb_at` | access token (JWT, curto) | `HttpOnly; Secure; SameSite=Lax; Path=/` |
| `__Secure-kb_rt` | refresh token (opaco, rotativo) | `HttpOnly; Secure; SameSite=Lax; Path=/auth` |

---

## ⚙️ Configuração

Copie `.env.example` para `.env` (nunca versionado). A configuração é validada no boot: o serviço **não
sobe** com chave ausente, `*` em origens, cookie `__Host-` sem `Secure` ou parâmetros de Argon2id abaixo
do mínimo em produção. Valores abaixo são exemplos fictícios.

| Variável | Obrigatória | Exemplo | Onde é usada |
| --- | --- | --- | --- |
| `DATABASE_URL` | sim | `postgresql+psycopg://authservice:senha-ficticia@localhost:5432/authservice` | conexão com o PostgreSQL |
| `POSTGRES_PASSWORD` | no compose | `senha-ficticia` | senha do banco criado pelo `docker-compose.yml` |
| `JWT_PRIVATE_KEY_FILE` ou `JWT_PRIVATE_KEY` | uma das duas | `keys/jwt_private.pem` | assinatura dos access tokens (gerada por `generate_keys`) |
| `JWT_ADDITIONAL_PUBLIC_KEYS(_FILE)` | não | `keys/jwt_previous_public.pem` | chaves públicas antigas durante uma rotação |
| `JWT_ISSUER`, `JWT_AUDIENCE` | sim | `http://localhost:8010`, `knowledge-api` | `iss` e `aud` dos tokens; iguais a `AUTH_ISSUER` e `AUTH_AUDIENCE` da BaseCore |
| `AUTH_PORT` | não | `8010` | porta publicada pelo compose (o exemplo vem com 8010, a que a BaseCore espera; sem a variável, 8000) |
| `ENVIRONMENT` | não | `development` | `production` liga as validações de produção |
| `COOKIE_SECURE`, `ACCESS_COOKIE_NAME`, `REFRESH_COOKIE_NAME`, `REFRESH_COOKIE_PATH`, `COOKIE_DOMAIN` | não | `false`, `kb_at`, `kb_rt`, `/auth` | cookies de sessão (produção: `true`, `__Host-kb_at`, `__Secure-kb_rt`) |
| `ACCESS_TOKEN_TTL_SECONDS`, `REFRESH_TOKEN_TTL_SECONDS`, `SESSION_MAX_LIFETIME_SECONDS` | não | `600`, `604800`, `2592000` | validade dos tokens e da sessão |
| `TRUSTED_ORIGINS` | em produção | `http://localhost:3000` | origens aceitas em mutações (CSRF) |
| `CORS_ALLOWED_ORIGINS` | não | vazio | vazio = CORS desligado |
| `LOGIN_RATE_LIMIT_*`, `TRUSTED_PROXY_COUNT` | não | `5`, `30`, `60`, `10`, `900`, `0` | limites de login e proxies confiáveis ([`docs/AUTENTICACAO.md`](../docs/AUTENTICACAO.md#limites-de-tentativas)) |
| `PUBLIC_REGISTRATION_ENABLED`, `REGISTER_RATE_LIMIT_*` | não | `true`, `30`, `600` | cadastro público e seu limite |
| `PUBLIC_APP_URL` | em produção (https) | `http://localhost:3000` | links dos emails e retorno do login social |
| `EMAIL_BACKEND`, `EMAIL_FROM`, `SMTP_*` | em produção (SMTP com TLS) | `smtp`, `mailpit`, `1025` | envio de email (Mailpit no compose local) |
| `PASSWORD_RESET_*`, `EMAIL_VERIFICATION_*`, `TOKEN_CONFIRM_RATE_LIMIT_*` | não | `1800`, `86400` | validade e limites dos links por email |
| `TERMS_VERSION`, `PRIVACY_POLICY_VERSION`, `CONSENT_RECORD_IP` | não | `2026-10-10`, `true` | versões vigentes dos documentos e registro do IP no aceite |
| `OAUTH_GOOGLE_*`, `OAUTH_GITHUB_*` | não | vazio | login social (provedor sem credenciais fica desligado) |
| `OPENAPI_ENABLED` | não | vazio | `/docs` e `/openapi.json`: ligado em desenvolvimento, desligado em produção |
| `SEED_DEV_USERS`, `SEED_*` | não (só desenvolvimento) | `true` | cria contas de teste no `migrate`; recusado em produção |

Lista completa e comentada: [`.env.example`](./.env.example). O exemplo já vem com `AUTH_PORT=8010` e
`JWT_ISSUER=http://localhost:8010`, os valores que a BaseCore e o compose da raiz esperam.

---

## 🚀 Como rodar

Todos os comandos rodam na pasta `AuthService/`. Para subir junto com a BaseCore, use o compose da raiz
([README da raiz](../README.md)).

### Com Docker *(recomendado)*

```bash
cp .env.example .env                 # defina POSTGRES_PASSWORD (e a mesma senha na DATABASE_URL)
python -m backend.scripts.generate_keys
docker compose up -d --build         # PostgreSQL + migrations + serviço + Mailpit
docker compose run --rm migrate python -m backend.cli create-user --email admin@exemplo.test --username admin --name "Administrador" --role admin
```

O `create-user` pede a senha duas vezes no terminal. Para rodar sem terminal (script ou CI), passe a senha
pela variável `AUTHSERVICE_NEW_USER_PASSWORD` (ex.: `docker compose run --rm -e AUTHSERVICE_NEW_USER_PASSWORD migrate ...`),
nunca como argumento.

O serviço fica em http://localhost:8010 (`AUTH_PORT` do exemplo) e o Mailpit em http://localhost:8025.

> Em Linux, o container roda como o usuário `app` (uid 10001): garanta que ele consiga ler `keys/jwt_private.pem` no volume montado.

### Sem Docker

```bash
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
cp .env.example .env                                 # aponte DATABASE_URL para um PostgreSQL
python -m backend.scripts.generate_keys
alembic upgrade head
python -m backend.cli create-user --email admin@exemplo.test --username admin --name "Administrador" --role admin
uvicorn backend.main:create_app --factory --reload
```

### Testes e qualidade

```bash
export TEST_DATABASE_URL=postgresql+psycopg://postgres:postgres@127.0.0.1:15432/authservice_test
pytest --cov                       # recria o schema auth do banco de teste
ruff check backend migrations tests && ruff format --check backend migrations tests
mypy
python -m backend.scripts.export_openapi   # após mudar a API
```

Como subir o banco de teste e o que cada suíte cobre: [`docs/TESTES.md`](../docs/TESTES.md).

### Manutenção

`python -m backend.cli purge-expired` remove sessões expiradas, contadores de rate limit vencidos e os links/estados temporários (redefinição de senha, confirmação de email, login social) vencidos. Agende a execução diária: `docker compose --profile ops up -d purge` ou o agendador da hospedagem ([`docs/IMPLANTACAO.md`](./docs/IMPLANTACAO.md)). No plano gratuito da Render não há agendador: a execução é manual ([`docs/DEPLOY.md`](../docs/DEPLOY.md#8-operação-sem-shell)).

`python -m backend.cli delete-e2e-users` (só desenvolvimento, `SEED_DEV_USERS=true`) apaga as contas que os testes E2E da Base de Conhecimento criam (`cadastro-<n>@exemplo.com.br` e `e2e-<n>@exemplo.com.br`); o Playwright chama ao terminar.

---

## 🤝 Como contribuir

Siga o [guia de contribuição do repositório](../CONTRIBUTING.md). O CI do serviço (`.github/workflows/ci-authservice.yml`)
exige lint, tipos, testes e migrations verdes e roda quando algo muda em `AuthService/`.

---

## 📚 Documentação adicional

| Arquivo | Descrição |
| --- | --- |
| [docs/adr/](./docs/adr) | Decisões de arquitetura 0001 a 0016 (índice geral em [../docs/adr/README.md](../docs/adr/README.md)) |
| [docs/IMPLANTACAO.md](./docs/IMPLANTACAO.md) | Checklist de produção, proxy de borda, limpeza periódica e roteiro do primeiro deploy |
| [docs/AUDITORIA_AUTENTICACAO.md](./docs/AUDITORIA_AUTENTICACAO.md) | Relatório da auditoria de autenticação (2026-10) |
| [docs/openapi.json](./docs/openapi.json) | Contrato da API |
| [../docs/AUTENTICACAO.md](../docs/AUTENTICACAO.md) | Como a autenticação funciona de ponta a ponta |
| [read-model/](./read-model) | Guias do projeto de origem, mantidos como referência histórica |

---

## 📄 Licença

O AuthService está sob a licença **MIT**. Veja o arquivo [read-model/LICENSE](./read-model/LICENSE) para mais detalhes.

---

<div align="center">

Feito com 💚 — autenticação segura, testada e com estilo terminal.

⭐ Se gostou, deixe uma estrela no repositório!

</div>

<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=footer"/>
