# Deploy na Render (plano gratuito)

Como pôr a BaseCore e o AuthService no ar na Render, só com recursos gratuitos. A decisão e as alternativas
estão no [ADR-0018](./adr/0018-render.md); o checklist de produção do AuthService, em
[IMPLANTACAO.md](../AuthService/docs/IMPLANTACAO.md).

Limites e comportamentos da Render citados aqui foram conferidos na documentação oficial em 2026-10-17.
O que não foi verificado na prática está marcado como **não verificado**.

## 1. Topologia

| Recurso | Tipo na Render | Plano | Observação |
| --- | --- | --- | --- |
| `authservice-sst-db` | Render Postgres | gratuito | Definido no Blueprint; só um gratuito por workspace. |
| `authservice-sst` | Web Service, Docker, `rootDir: AuthService` | gratuito | **Público**: o plano gratuito não tem Private Service. |
| `basecore-sst` | Web Service, Docker, `rootDir: BaseCore` | gratuito | Página pública. As variáveis `AUTH_*` entram no build. |
| Limpeza `purge-expired` | nenhum (Cron Job é pago) | n/a | Manual (seção 8). |

Banco e serviços ficam em **Oregon**: a região é a mesma para os três e não muda depois da criação.

Caminho de uma requisição: navegador → `basecore-sst` (rewrites `/auth/*` e `/content/*`) → URL pública do
`authservice-sst` → banco pela rede privada. O serviço gratuito pode **enviar** tráfego privado ao banco da
mesma região, mas não **recebe** tráfego privado; por isso a BaseCore chama o AuthService pela URL pública.

## 2. Limites do plano gratuito

| Limite | Efeito neste projeto |
| --- | --- |
| Serviço dorme após 15 min sem tráfego e leva cerca de 1 min para acordar | O primeiro acesso depois de uma pausa é lento. O primeiro login pode responder "indisponível" enquanto o AuthService acorda; tente de novo em um minuto. |
| 750 horas de instância por mês, **para o workspace inteiro** | Ver seção 12. Se acabarem, todos os serviços gratuitos do workspace ficam suspensos até o mês seguinte. |
| Postgres gratuito: expira 30 dias após a criação, com 14 dias de carência antes de ser apagado; 1 GB; sem backup | Dados do teste são descartáveis. Para uso real, migrar antes (seção 3.3). |
| Um Postgres gratuito por workspace | A vaga precisa estar livre antes de criar o Blueprint. |
| Sem pre-deploy, Shell, jobs avulsos e Cron Job | Migrations no comando de início; operação a partir de uma máquina local (seção 8). |
| Saída nas portas 25, 465 e 587 bloqueada | Sem SMTP (seção 10). |
| Sem Private Service; serviço gratuito não recebe tráfego privado | AuthService público (seção 9). |
| Deploy a partir de URL pública: sem deploy automático | Cada deploy é manual (seção 7). |

## 3. Banco de dados

### 3.1 Criação e ligação

O Blueprint cria `authservice-sst-db` com `plan: free` explícito (sem ele, a Render usa um plano pago) e liga
o `DATABASE_URL` do AuthService por referência (`fromDatabase`, propriedade `connectionString`, que é a URL
**interna**). A senha do banco é gerada pela Render e não passa por ninguém.

O AuthService aceita o formato `postgresql://` entregue pela Render: o SQLAlchemy 2.1 (versão fixada em
`AuthService/requirements.txt`) resolve esse esquema para o driver `psycopg` 3. Conferido em 2026-10-17 dentro
da imagem do AuthService. O formato `postgresql+psycopg://` também funciona.

### 3.2 Acesso externo

O Blueprint cria o banco com `ipAllowList: []`, que bloqueia toda conexão externa. Para uma tarefa local
(seção 8), no painel do banco, em **Info > Networking**, acrescente só o seu IP com `/32`, rode a tarefa e
remova a liberação. Conexões externas sempre usam TLS; a Render recusa `sslmode=disable`.

### 3.3 Migração para um banco durável

Se o uso deixar de ser teste, migre antes da expiração. Com o Docker, sem instalar o cliente do PostgreSQL
(a versão do `pg_dump` tem de ser igual ou maior que a do servidor):

```bash
read -rs DATABASE_URL && export DATABASE_URL          # URL EXTERNA do banco atual (seu IP liberado)
docker run --rm -e DATABASE_URL postgres:18 sh -c 'pg_dump --format=custom --no-owner --no-acl "$DATABASE_URL"' > authservice.dump
read -rs NEW_DATABASE_URL && export NEW_DATABASE_URL  # URL do banco novo
docker run --rm -i -e NEW_DATABASE_URL postgres:18 sh -c 'pg_restore --no-owner --no-acl --dbname="$NEW_DATABASE_URL"' < authservice.dump
unset DATABASE_URL NEW_DATABASE_URL
```

Depois: trocar o `DATABASE_URL` do AuthService para o banco novo, fazer um deploy, validar (seção 11) e apagar
o `authservice.dump` (contém hashes de senha e dados pessoais).

## 4. Variáveis

### AuthService (`authservice-sst`)

| Variável | Valor | Onde |
| --- | --- | --- |
| `ENVIRONMENT` | `production` | `render.yaml` |
| `PORT` | `8000` | `render.yaml` |
| `JWT_AUDIENCE`, `ACCESS_COOKIE_NAME` | `knowledge-api`, `__Host-kb_at` | grupo `base-sst-auth` |
| `TRUSTED_PROXY_COUNT` | `0` (seção 9) | `render.yaml` |
| `EMAIL_BACKEND` | `disabled` (seção 10) | `render.yaml` |
| `DATABASE_URL` | URL interna do `authservice-sst-db` | `render.yaml`, por referência |
| `JWT_PRIVATE_KEY` | chave Ed25519 nova (seção 5) | painel (segredo) |
| `JWT_ISSUER` | `https://<authservice>.onrender.com` | painel |
| `PUBLIC_APP_URL` | `https://<basecore>.onrender.com` | painel |
| `TRUSTED_ORIGINS` | `https://<basecore>.onrender.com` | painel |

Ficam no padrão do código: `COOKIE_SECURE=true`, `OPENAPI_ENABLED` desligado em produção, `SEED_DEV_USERS`
desligado (e recusado em produção), cookie de refresh `__Secure-kb_rt` em `/auth`.

O validador de produção recusa a subida se faltar `TRUSTED_ORIGINS`, se `PUBLIC_APP_URL` não for `https`, se
`SEED_DEV_USERS` estiver ligado, se `COOKIE_SECURE` for falso ou se houver SMTP sem TLS. Sem SMTP
(`EMAIL_BACKEND=disabled`), ele **sobe**: os emails deixam de ser enviados e o log registra cada um que não
saiu.

### BaseCore (`basecore-sst`)

| Variável | Valor | Onde |
| --- | --- | --- |
| `PORT` | `3000` | `render.yaml` |
| `AUTH_AUDIENCE`, `AUTH_ACCESS_COOKIE_NAME` | `knowledge-api`, `__Host-kb_at` | grupo `base-sst-auth` |
| `AUTH_INTERNAL_URL` | `https://<authservice>.onrender.com` | painel |
| `AUTH_ISSUER` | igual ao `JWT_ISSUER` do AuthService | painel |

As quatro `AUTH_*` precisam existir **no build**: os rewrites são fixados nele. A Render passa as variáveis do
serviço ao `docker build` como argumentos de build. Que isso inclua as variáveis do grupo é **não verificado**;
se o build sair sem login (`/auth/login` com 404), defina `AUTH_AUDIENCE` e `AUTH_ACCESS_COOKIE_NAME` direto no
serviço.

## 5. Segredos de produção

Regras: chaves novas, nunca as de desenvolvimento; nenhum segredo em tela, log, commit, arquivo versionado ou
URL; cada um é colado direto no painel da Render.

**Chave JWT**, gerada numa máquina local com a imagem do AuthService, no PowerShell, na raiz do repositório:

```powershell
docker compose run --rm --no-deps -T auth-service python -c "from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey as K; from cryptography.hazmat.primitives import serialization as s; print(K.generate().private_bytes(s.Encoding.PEM, s.PrivateFormat.PKCS8, s.NoEncryption()).decode(), end='')" | Set-Clipboard
# cole em JWT_PRIVATE_KEY no painel da Render e salve; depois limpe a área de transferência:
Set-Clipboard -Value " "
```

A chave vai direto para a área de transferência, sem aparecer na tela nem ser gravada em disco.

**Senha do banco:** gerada pela Render e ligada por referência; não precisa ser copiada.

**Senha do primeiro administrador:** escolhida na hora, digitada sem eco (seção 8) e nunca gravada.

## 6. Passo a passo

### 6.1 Blueprint pela URL pública

A documentação do botão "Deploy to Render" diz que repositórios públicos funcionam e que uma branch
diferente da padrão vai ao fim da URL do repositório, como `/tree/<branch>`. Para esta branch:

```text
https://render.com/deploy?repo=https://github.com/VictorCardosoOl/Base_de_Conhecimento/tree/chore/monorepo-2.0.0
```

**Não verificado:** se a branch com barra no nome (`chore/...`) é reconhecida nesse formato, e se o
`dockerfilePath` é relativo ao `rootDir` (a documentação de monorepo diz que sim; a referência do Blueprint
diz "relativo à raiz do repositório"). Confira na tela de revisão antes de aprovar, inclusive o plano Free de
cada recurso. Se o Blueprint não aceitar a URL ou a branch, crie os recursos à mão (6.2).

Na criação, a Render pede cada variável com `sync: false`. As URLs ainda não existem nesse momento: use os
nomes previstos (`https://authservice-sst.onrender.com` e `https://basecore-sst.onrender.com`) e corrija no
passo 6.3, se a Render acrescentar um sufixo ao nome.

### 6.2 Criação manual (alternativa)

1. **New > Postgres**: nome `authservice-sst-db`, banco `authservice`, usuário `authservice`, região Oregon,
   plano **Free**. Em Networking, remova a liberação padrão (`0.0.0.0/0`).
2. **New > Web Service > Public Git Repository**, com a URL
   `https://github.com/VictorCardosoOl/Base_de_Conhecimento` e o campo de branch preenchido com
   `chore/monorepo-2.0.0` (nunca `main` antes do merge). Para cada serviço: runtime Docker, plano Free, região
   Oregon, Root Directory, Dockerfile Path, Docker Command (só o AuthService), Health Check Path e variáveis
   iguais ao `render.yaml`. O `DATABASE_URL` do AuthService é a **Internal Database URL** do banco, colada no
   painel por quem cria o serviço.

### 6.3 Ordem

1. **Banco.** Status `available`.
2. **AuthService.** Esperar o deploy ficar ativo: o log mostra o `alembic upgrade head`, depois
   `authservice_started` e um `deployment_warning` sobre `TRUSTED_PROXY_COUNT=0` (esperado; seção 9).
   `https://<authservice>.onrender.com/health` responde `200`.
3. **BaseCore.** Variáveis da seção 4, com a URL real do AuthService. Se o AuthService mudou de URL depois do
   primeiro build da BaseCore, faça um novo deploy da BaseCore (os rewrites são do build).
4. Corrigir `PUBLIC_APP_URL` e `TRUSTED_ORIGINS` do AuthService com a URL real da BaseCore, se diferente.
5. Primeiro administrador (seção 8) e validação (seção 11).

## 7. Deploys

Serviços criados por URL pública não fazem deploy automático. Para publicar um commit novo da branch:

- **Painel:** Manual Deploy > Deploy latest commit, em cada serviço que mudou.
- **Deploy Hook:** cada serviço tem uma URL própria (Settings > Deploy Hook). Um `GET` ou `POST` nela dispara o
  deploy; com `?ref=<sha>`, o de um commit específico. **A URL é um segredo**: quem a tiver dispara deploys.
  Não a coloque no repositório nem em logs.

Os filtros de build (`buildFilter`) não valem para deploys manuais; eles ficam no `render.yaml` para quando o
repositório for conectado com deploy automático.

As migrations rodam no comando de início do AuthService (`alembic upgrade head` antes do `uvicorn`), a cada
deploy e a cada vez que o serviço acorda. Sem migration pendente, o passo leva menos de um segundo.

## 8. Operação sem Shell

Do seu terminal, na raiz do repositório, com a imagem do AuthService (`docker compose build auth-service`, se
ainda não existir). As variáveis passadas com `-e` têm prioridade sobre o `AuthService/.env` local. Antes,
libere o seu IP no banco (seção 3.2) e copie a **External Database URL** pelo botão de copiar do painel.

Bash (Git Bash):

```bash
read -rs DATABASE_URL && export DATABASE_URL     # cole a URL externa; nada aparece
# primeiro administrador (a senha é digitada sem eco e não fica no histórico):
read -rs AUTHSERVICE_NEW_USER_PASSWORD && export AUTHSERVICE_NEW_USER_PASSWORD
docker compose run --rm --no-deps -T -e DATABASE_URL -e AUTHSERVICE_NEW_USER_PASSWORD auth-service \
  python -m backend.cli create-user --email SEU-EMAIL --username admin --name "Administrador" --role admin
# limpeza periódica:
docker compose run --rm --no-deps -T -e DATABASE_URL auth-service python -m backend.cli purge-expired
unset DATABASE_URL AUTHSERVICE_NEW_USER_PASSWORD
```

PowerShell 7:

```powershell
$env:DATABASE_URL = Read-Host -MaskInput "URL externa do banco"
$env:AUTHSERVICE_NEW_USER_PASSWORD = Read-Host -MaskInput "Senha do administrador"
docker compose run --rm --no-deps -T -e DATABASE_URL -e AUTHSERVICE_NEW_USER_PASSWORD auth-service python -m backend.cli create-user --email SEU-EMAIL --username admin --name "Administrador" --role admin
docker compose run --rm --no-deps -T -e DATABASE_URL auth-service python -m backend.cli purge-expired
Remove-Item Env:DATABASE_URL, Env:AUTHSERVICE_NEW_USER_PASSWORD
```

Ao terminar, remova a liberação do seu IP no banco. Sem usuários de teste em produção: o seed é recusado pelo
validador.

**`purge-expired` sem Cron Job.** Alternativa gratuita avaliada e **não adotada**: um workflow agendado do
GitHub Actions rodando o comando contra a URL externa do banco. Exigiria guardar a URL do banco como segredo
no repositório do Victor e abrir o banco a qualquer IP (os executores do GitHub não têm IP fixo). Para o teste,
a execução manual basta: sem ela, só crescem tabelas de sessões e contadores vencidos.

## 9. IP do cliente e `TRUSTED_PROXY_COUNT`

No plano gratuito o AuthService é público. Os caminhos até ele têm números de saltos diferentes:

- pela BaseCore: navegador → borda da Render → Next → borda da Render → AuthService;
- direto: navegador → borda da Render → AuthService.

Um `TRUSTED_PROXY_COUNT` medido para o primeiro caminho confia em saltos demais no segundo, e quem chamar o
AuthService direto escolhe o próprio IP. Por isso, **no plano gratuito o valor fica em `0`**. O custo é o risco
F1: os limites por IP viram um limite global (30 falhas por minuto, de quaisquer pessoas, bloqueiam o login de
todos por até 1 minuto). O limite por conta continua valendo. O aviso `deployment_warning` sobre
`TRUSTED_PROXY_COUNT=0` no boot é esperado e registra essa escolha.

Medir mesmo assim, para registro (roteiro de `IMPLANTACAO.md`, seção 7, caso B, **pulando o passo 2**, que
exige AuthService privado): com `0`, o script deve dar `OK` com um IP da Render. Não suba o valor enquanto o
AuthService for público.

## 10. Email

**Situação:** o AuthService sobe sem SMTP (`EMAIL_BACKEND=disabled`). Sem envio, não funcionam a recuperação
de senha nem a confirmação de email; login, cadastro e o resto seguem funcionando. SMTP com Gmail também não
funcionaria: a Render bloqueia as portas 25, 465 e 587 nos serviços gratuitos.

**Opções de envio por HTTPS** (nenhuma implementada; exigem um adaptador novo em
`AuthService/backend/core/email.py`, configurações novas e testes; dá para fazer com a biblioteca padrão do
Python, sem dependência nova):

| Serviço | Gratuito (comparativos de 2026, conferir na contratação) | Observação |
| --- | --- | --- |
| API do Gmail | cotas da conta Gmail do projeto | Usa a conta do projeto. Exige projeto no Google Cloud, tela de consentimento OAuth e um refresh token guardado como segredo. |
| Brevo | cerca de 300 emails por dia | Aceita remetente único verificado (pode ser a conta Gmail); remetente `@gmail.com` enviado por terceiros tende a cair em spam (DMARC). |
| Resend | 3.000 por mês, 100 por dia | Para enviar a qualquer destinatário, exige domínio próprio verificado. |
| Mailgun | cerca de 100 por dia | Sem domínio próprio, só destinatários autorizados; relatos de cartão exigido. |

Recomendação para o teste: API do Gmail (é a conta que o projeto já terá) ou Brevo. A escolha e a
implementação dependem de aprovação.

**No painel da Render, quando houver adaptador:** `EMAIL_BACKEND` com o novo valor, as credenciais da opção
escolhida como segredo (colar no painel, nunca no chat ou no repositório) e o remetente (`EMAIL_FROM`).

## 11. Validação depois do deploy

| # | Conferir | Esperado |
| --- | --- | --- |
| 1 | `https://<authservice>.onrender.com/health` e `/.well-known/jwks.json` | `200`; JWKS com uma chave `OKP`/`Ed25519` |
| 2 | `https://<authservice>.onrender.com/openapi.json` | `404` |
| 3 | Log de boot do AuthService | só o aviso de `TRUSTED_PROXY_COUNT=0` |
| 4 | Página inicial e um artigo da BaseCore | `200`, com os cabeçalhos de segurança |
| 5 | `/admin` sem sessão | redireciona para `/login?next=%2Fadmin` |
| 6 | Login com o administrador | cookies `__Host-kb_at` (Path `/`) e `__Secure-kb_rt` (Path `/auth`), `HttpOnly`, `Secure`, `SameSite=Lax`; `/conta` e `/admin` abrem |
| 7 | Logout e "Sair de todos os dispositivos" | `204`, e `/conta` volta a pedir login |
| 8 | Uma requisição com `Origin` de outro site ao `/auth/login` | `403` "Origem não permitida" |
| 9 | Primeiro acesso depois de 15 min parado | registrar o tempo (partida a frio) |
| 10 | `purge-expired` (seção 8) | uma linha de contagens e saída `0` |

## 12. Horas gratuitas

As 750 horas por mês são do workspace e só contam enquanto um serviço está acordado. Um serviço acordado o mês
inteiro gasta de 720 a 744 horas, quase tudo sozinho.

Estimativa para o uso de teste (não medida): cada visita depois de uma pausa acorda a BaseCore, e o login
acorda também o AuthService; cada um fica acordado ao menos 15 minutos depois do último acesso. Com cerca de
10 períodos de uso por dia, os dois juntos gastam de 6 a 8 horas por dia, ou **180 a 240 horas por mês**.

O workspace tem outros serviços gratuitos, que dividem as mesmas horas. **Risco:** se a soma passar de 750,
**todos** os serviços gratuitos do workspace ficam suspensos até o mês seguinte, inclusive os de outros
projetos. Mitigação:

- suspender `basecore-sst` e `authservice-sst` no painel quando não houver teste, e retomá-los antes do uso;
- acompanhar o consumo em **Billing** no painel, uma vez por semana;
- não manter os serviços acordados com monitoramento ou "pingadores": cada um gastaria o mês inteiro de horas.

## 13. Reversão

| Situação | O que fazer |
| --- | --- |
| Deploy novo com erro | No serviço, Events > Rollback para o deploy anterior. |
| Migration com problema | Rollback do serviço e, do seu terminal (seção 8), `alembic downgrade -1` contra a URL externa. Dados do teste são descartáveis. |
| Variável errada | Corrigir no painel; a Render refaz o deploy. Se for `AUTH_*`, novo deploy da BaseCore. |
| Tirar do ar | Suspender os serviços no painel (não apagar sem decisão do dono). |

## 14. Merge futuro (não executado)

1. Refazer o fetch e verificar se a `main` avançou desde `4e4fade`. Se avançou, trazer as mudanças para a
   branch e revalidar antes de seguir.
2. Abrir um Pull Request de `chore/monorepo-2.0.0` para a `main`.
3. No merge, usar **Create a merge commit** ou **Rebase and merge**, **nunca Squash**: o squash junta tudo num
   commit só, perde o commit de renomeações e quebra o `git log --follow` dos arquivos da BaseCore.
4. Imediatamente antes do merge, trocar o Root Directory do projeto na Vercel para `BaseCore`. Sem isso, o
   primeiro build da `main` depois do merge falha (não há mais `package.json` na raiz).
5. Depois do merge, apontar os serviços da Render para a branch `main` e fazer um deploy manual de cada um.
