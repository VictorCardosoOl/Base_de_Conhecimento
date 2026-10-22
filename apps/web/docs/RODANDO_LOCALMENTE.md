# 💻 Rodando o projeto localmente

Passo a passo para subir a Base de Conhecimento com login, cadastro e painel administrativo
na sua máquina. Leva uns 15 minutos na primeira vez; depois, **um comando só**:

```bash
npm run dev:all
```

Ele sobe o banco e o AuthService no Docker (aplicando migrations novas), **espera os dois
ficarem saudáveis** e só então inicia o site em http://localhost:3000. Tudo está no
`package.json`, sem scripts extras. O Docker Desktop precisa estar aberto.

| Comando               | O que faz                                                         |
| --------------------- | ----------------------------------------------------------------- |
| `npm run dev:all`     | tudo, com o site em modo de desenvolvimento (recarrega ao editar) |
| `npm run start:all`   | tudo, com build de produção (`next build` + `next start`)         |
| `npm run stop:all`    | para o AuthService e o banco (os dados continuam guardados)       |
| `npm run auth:up`     | só sobe o AuthService e o banco (e espera ficarem saudáveis)      |
| `npm run auth:status` | mostra a situação dos containers do AuthService                   |
| `npm run auth:logs`   | últimos logs das migrations e do AuthService                      |
| `npm run check`       | lint, tipos e testes unitários de uma vez                         |

Os comandos usam o AuthService da pasta `AuthService/`, vizinha de `BaseCore/` no mesmo
repositório (seção 2). As seções abaixo explicam a configuração da primeira vez e o que
cada etapa faz por baixo.

> Prefere tudo em containers, sem Node na máquina? Configure o `AuthService/.env` (seção 3) e use o
> `docker compose up -d --build` na raiz do repositório ([README da raiz](../../README.md#-tudo-junto-em-containers)).

---

## Visão geral

São quatro peças. O navegador só fala com o Next; o Next repassa `/auth/*` e `/content/*` para o AuthService.

| Peça                               | Onde roda       | Endereço              |
| ---------------------------------- | --------------- | --------------------- |
| **Base de Conhecimento** (Next.js) | no seu terminal | http://localhost:3000 |
| **AuthService** (FastAPI)          | Docker          | http://localhost:8010 |
| **PostgreSQL** do AuthService      | Docker          | só dentro do Docker   |
| **Mailpit** (caixa de email local) | Docker          | http://localhost:8025 |

> Sem o AuthService, o site abre normalmente para leitura; só login, cadastro, "Minha conta"
> e o painel `/admin` ficam indisponíveis.

---

## 1. Pré-requisitos

Instale uma vez:

- **Git**
- **Node.js 22** (versão do CI e do Docker; testado também com 24.11) e npm, que já vem junto
- **Docker Desktop**, que precisa estar **aberto** sempre que for usar o projeto
- **Python 3.11 ou mais novo**: só para gerar as chaves de assinatura, uma única vez

Confira:

```bash
git --version
node -v
docker --version
python --version
```

---

## 2. Baixar o repositório

O AuthService e a Base de Conhecimento ficam no mesmo repositório, nas pastas `AuthService/` e
`BaseCore/`:

```bash
git clone https://github.com/VictorCardosoOl/Base_de_Conhecimento.git
```

---

## 3. Configurar e subir o AuthService

Dentro da pasta `AuthService`:

### 3.1 Criar o `.env`

```bash
cp .env.example .env
```

Abra o `.env` e ajuste:

| Variável            | Valor                                           | Por quê                                                 |
| ------------------- | ----------------------------------------------- | ------------------------------------------------------- |
| `POSTGRES_PASSWORD` | uma senha sua, só para o banco local            | o exemplo vem com um valor a trocar                     |
| `DATABASE_URL`      | troque a senha dentro da URL pela mesma de cima | o serviço usa essa URL                                  |
| `TRUSTED_ORIGINS`   | deve conter `http://localhost:3000`             | origem do Next; sem ela, login e cadastro são recusados |

Os demais valores do exemplo já servem para desenvolvimento. Entre eles: `AUTH_PORT=8010` e
`JWT_ISSUER=http://localhost:8010` (porta e emissor que a Base espera),
`COOKIE_SECURE=false`, `ACCESS_COOKIE_NAME=kb_at`, `PUBLIC_REGISTRATION_ENABLED=true` (libera
o `/cadastro`) e `SEED_DEV_USERS=true`, que cria as contas de teste (seção 6).

> Nunca versione o `.env` nem a pasta `keys/`; os dois já estão no `.gitignore`.

### 3.2 Gerar as chaves (só na primeira vez)

```bash
python -m venv .venv
```

Ative o ambiente:

- Windows: `.venv\Scripts\activate`
- Linux/macOS: `source .venv/bin/activate`

Depois:

```bash
pip install -r requirements.txt
python -m backend.scripts.generate_keys
```

O comando cria `keys/jwt_private.pem` e `keys/jwt_public.pem`. Se as chaves já existirem, ele
para sem alterar nada. Não use `--force` à toa: trocar a chave encerra todas as sessões.

### 3.3 Subir

```bash
docker compose up -d --build
```

Isso sobe o banco, aplica as migrations, cria as contas de teste e inicia o serviço. Confira:

```bash
curl http://localhost:8010/health
```

A resposta esperada é `{"status":"ok","database":"up"}`; `"degraded"` / `"down"` indica que o banco não está de pé. Se algo falhar, veja os logs:

```bash
docker compose logs migrate auth-service
```

---

## 4. Configurar e subir a Base de Conhecimento

Dentro da pasta `BaseCore`:

### 4.1 Instalar as dependências

```bash
npm ci
```

Use `npm ci`, não `npm install`: ele instala exatamente as versões do `package-lock.json`.

### 4.2 Criar o `.env.local`

```bash
cp .env.example .env.local
```

Os valores do exemplo já apontam para o AuthService local:

| Variável                  | Valor                   | Deve ser igual a (AuthService) |
| ------------------------- | ----------------------- | ------------------------------ |
| `AUTH_INTERNAL_URL`       | `http://localhost:8010` | endereço do serviço            |
| `AUTH_ISSUER`             | `http://localhost:8010` | `JWT_ISSUER`                   |
| `AUTH_AUDIENCE`           | `knowledge-api`         | `JWT_AUDIENCE`                 |
| `AUTH_ACCESS_COOKIE_NAME` | `kb_at`                 | `ACCESS_COOKIE_NAME`           |

Nenhuma dessas variáveis tem prefixo `NEXT_PUBLIC_`: elas ficam só no servidor.

### 4.3 Rodar

**Modo de desenvolvimento** (recarrega a cada alteração):

```bash
npm run dev
```

Abra http://localhost:3000.

**Modo de produção** (mais rápido para navegar; reflete o que vai ao ar):

```bash
npm run build
npm run start
```

Os dois modos usam a porta 3000; rode um de cada vez.

---

## 5. Conferir se está tudo certo

1. http://localhost:3000 abre o acervo de artigos.
2. O ícone de conta no cabeçalho abre **Entrar** e **Criar conta**.
3. Entre com uma conta de teste (seção 6): o menu passa a mostrar seu nome e papel.
4. Com a conta de administrador, `/admin/usuarios` lista e busca usuários; o botão
   **Cadastrar** abre o cadastro em duas etapas.
5. Em `/cadastro`, crie uma conta nova. Ela começa como **Leitor**.

---

## 6. Contas de teste

Na primeira subida, o AuthService cria uma conta por papel:

| Papel         | Email                | Usuário  | O que pode fazer                                       |
| ------------- | -------------------- | -------- | ------------------------------------------------------ |
| Administrador | `admin@teste.local`  | `admin`  | tudo, inclusive gerenciar usuários                     |
| Editor        | `editor@teste.local` | `editor` | painel de conteúdo; aprova pedidos de acesso de editor |
| Leitor        | `user@teste.local`   | `leitor` | consulta e lista de leitura                            |

As senhas estão em `SEED_*_PASSWORD`, no `.env.example` do AuthService. São só para
desenvolvimento: nunca reutilize. A criação só acontece se a conta ainda não existir; contas
que já existem não são alteradas.

---

## 7. Rotina do dia a dia

Na pasta `BaseCore`:

- **Começar:** `npm run dev:all`.
- **Encerrar:** `Ctrl+C` para o site; depois `npm run stop:all` para o AuthService e o banco.
- **Depois de um `git pull`:** rode `npm ci` se o `package-lock.json` mudou; o
  `npm run dev:all` já reconstrói o AuthService e aplica migrations novas.

Sem os atalhos, o equivalente manual é: abrir o Docker Desktop, rodar `docker compose up -d
--build` na pasta `AuthService` e `npm run dev` na pasta `BaseCore`.

---

## 8. Testes

Na pasta `BaseCore`:

| O quê                      | Comando                 |
| -------------------------- | ----------------------- |
| Testes unitários           | `npm test`              |
| Cobertura (mínimo de 70%)  | `npm run test:coverage` |
| Lint                       | `npm run lint`          |
| Tipos                      | `npm run typecheck`     |
| Lint + tipos + unitários   | `npm run check`         |
| Ponta a ponta (Playwright) | `npm run test:e2e`      |

Os testes de ponta a ponta usam o servidor da porta 3000; se não houver um rodando, sobem o
`npm run dev`. Os fluxos com login precisam das variáveis `E2E_*` (veja o `.env.example`),
apontando para contas de teste do AuthService local, nunca para contas reais. Sem elas, esses
testes são pulados. Com elas, o cadastro e a gestão de usuários criam contas
`cadastro-*@exemplo.com.br` e `e2e-*@exemplo.com.br`, que o Playwright apaga ao terminar
(`e2e/global-teardown.ts`). Se a limpeza falhar (AuthService parado), ele avisa e mostra o
comando para rodar à mão. Os testes de recuperação de senha e login social não gravam nada:
simulam as respostas do AuthService.

No AuthService, os testes (`pytest`) usam um PostgreSQL descartável, indicado em
`TEST_DATABASE_URL`; veja o README dele.

---

## 8.1 Emails, login social e termos

**Emails (recuperação de senha, confirmação).** Em desenvolvimento, o `docker compose` sobe o
**Mailpit**, que captura tudo o que o AuthService envia: abra http://localhost:8025 para ver
os links. Nada sai para a internet. Os emails `@teste.local` das contas de teste são
recusados pelo validador de email (domínio reservado), então para testar a redefinição
cadastre uma conta com um email comum (ex.: `voce@exemplo.com.br`).

Em produção, configure no `.env` do AuthService o SMTP de um provedor (Amazon SES,
SendGrid, Resend, Mailgun...): `EMAIL_BACKEND=smtp`, `EMAIL_FROM`, `SMTP_HOST`,
`SMTP_PORT=587`, `SMTP_SECURITY=starttls`, `SMTP_USERNAME`, `SMTP_PASSWORD`, e
`PUBLIC_APP_URL` com o endereço público do site (base dos links). No plano gratuito da Render, as portas
de SMTP são bloqueadas: veja [docs/DEPLOY.md](../../docs/DEPLOY.md#10-email).

**Login social (Google, GitHub).** Desligado até haver credenciais. Para ligar:

1. Crie o app no provedor e cadastre a URL de retorno:
   - Google (Google Cloud Console → APIs e serviços → Credenciais → ID do cliente OAuth,
     tipo "Aplicativo da Web"): `http://localhost:3000/auth/oauth/google/callback`
   - GitHub (Settings → Developer settings → OAuth Apps): Homepage
     `http://localhost:3000`, callback `http://localhost:3000/auth/oauth/github/callback`

   Em produção, troque `http://localhost:3000` pelo `PUBLIC_APP_URL`.
2. No `.env` do AuthService: `OAUTH_GOOGLE_CLIENT_ID` / `OAUTH_GOOGLE_CLIENT_SECRET` e/ou
   `OAUTH_GITHUB_CLIENT_ID` / `OAUTH_GITHUB_CLIENT_SECRET`.
3. `npm run auth:up`. Os botões aparecem sozinhos no login e no cadastro.

**Termos.** As versões em `src/features/legal/documents.ts` precisam ser iguais a
`TERMS_VERSION` e `PRIVACY_POLICY_VERSION` do AuthService (padrão `2026-10-10`).

---

## 9. Problemas comuns

| Sintoma                                                        | Causa provável                                                   | O que fazer                                                                                      |
| -------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `docker compose` falha com erro de conexão                     | Docker Desktop fechado                                           | abra o Docker Desktop e repita                                                                   |
| `/health` responde `"database":"down"`                         | o container do banco parou (ex.: depois de reiniciar o PC)       | `docker compose up -d` na pasta do AuthService                                                   |
| Login ou cadastro dizem "Serviço de autenticação indisponível" | AuthService parado ou em outra porta                             | `curl http://localhost:8010/health`; confira `AUTH_PORT=8010`                                    |
| Login funciona, mas a página continua como "não logado"        | nome do cookie ou emissor diferentes entre os dois `.env`        | `AUTH_ACCESS_COOKIE_NAME` = `ACCESS_COOKIE_NAME`; `AUTH_ISSUER` = `JWT_ISSUER`. Reinicie os dois |
| Login recusado com erro de origem (403)                        | `TRUSTED_ORIGINS` sem `http://localhost:3000`                    | ajuste o `.env` e rode `docker compose up -d`                                                    |
| `/cadastro` diz que o cadastro está desativado                 | `PUBLIC_REGISTRATION_ENABLED` não está `true`                    | ajuste o `.env` e rode `docker compose up -d`                                                    |
| Áreas logadas dão erro logo depois de atualizar o código       | AuthService sem as migrations novas                              | `docker compose up -d --build` no AuthService                                                    |
| "Muitas tentativas"                                            | limite de tentativas erradas (por IP, por IP e email, por conta) | espere o tempo mostrado na tela                                                                  |
| Email de redefinição não chega                                 | em desenvolvimento, ele fica no Mailpit                          | abra http://localhost:8025                                                                       |
| Botões do Google/GitHub não aparecem                           | provedor sem credenciais no `.env` do AuthService                | defina `OAUTH_*_CLIENT_ID` e `_SECRET` e rode `npm run auth:up`                                  |
| Cadastro diz que os termos foram atualizados                   | versões diferentes entre o site e o AuthService                  | iguale `documents.ts` e `TERMS_VERSION`/`PRIVACY_POLICY_VERSION`                                 |
| `npm ci` falha com `EPERM` no Windows                          | um `next dev` ou `next start` ainda está aberto                  | feche-o e repita                                                                                 |
| Porta 3000 ou 8010 ocupada                                     | outro processo usando a porta                                    | feche o processo, ou troque `AUTH_PORT` (e as URLs no `.env.local`)                              |

### Recomeçar o banco do zero

**Isso apaga todos os usuários locais.** As contas de teste são recriadas na subida seguinte.

```bash
docker compose down -v
docker compose up -d --build
```

---

## Para saber mais

- [docs/AUTENTICACAO.md](../../docs/AUTENTICACAO.md): como a Base de Conhecimento usa o AuthService
  (sessão, cookies, papéis, rotas protegidas). O histórico da integração está em
  [INTEGRACAO_AUTH.md](./INTEGRACAO_AUTH.md).
- README do AuthService: endpoints, decisões de arquitetura (ADRs) e execução sem Docker.
