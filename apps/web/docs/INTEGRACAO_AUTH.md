# 🔗 Integração com o AuthService

> **Documento histórico.** Registra como a integração foi construída, etapa por etapa, até a versão
> 2.0.0. A referência atual de autenticação é [docs/AUTENTICACAO.md](../../docs/AUTENTICACAO.md); se
> houver diferença, vale ela.

Contrato que a Base de Conhecimento consome do AuthService, validado em 2026-09-27 contra a branch `feat/fase-1-auth-persistente` (32/32 verificações em execução real, além da verificação do token no Node com `jose`).

---

## Topologia

```text
Navegador ──▶ Next.js (mesma origem) ──rewrite /auth/*──▶ AuthService ──▶ PostgreSQL
                  │
                  └── servidor Next: valida o access token via JWKS e consulta /auth/me
```

- O navegador **só** fala com a origem do Next. `/auth/*` é repassado ao AuthService (`next.config.ts`).
- `/admin/*` **não** é repassado: são páginas da Base de Conhecimento.
- Sem `AUTH_INTERNAL_URL`, o proxy fica desligado. Isso é temporário: a variável passa a ser obrigatória quando o login falso for removido.

---

## Configuração (`.env.local`, só servidor)

| Variável                  | Exemplo local                                                | Deve bater com (AuthService) |
| ------------------------- | ------------------------------------------------------------ | ---------------------------- |
| `AUTH_INTERNAL_URL`       | `http://localhost:8010`                                      | endereço do serviço          |
| `AUTH_ISSUER`             | `http://localhost:8010`                                      | `JWT_ISSUER`                 |
| `AUTH_AUDIENCE`           | `knowledge-api`                                              | `JWT_AUDIENCE`               |
| `AUTH_ACCESS_COOKIE_NAME` | `kb_at` (produção: `__Host-kb_at`)                           | `ACCESS_COOKIE_NAME`         |
| `AUTH_JWKS_URL`           | opcional; padrão `<AUTH_INTERNAL_URL>/.well-known/jwks.json` | —                            |

No AuthService: `TRUSTED_ORIGINS` deve conter a origem do Next (ex.: `http://localhost:3000`).

---

## Endpoints usados

| Chamada                                  | Quem chama                                                                | Resultado                                                                                                                                                                   |
| ---------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /auth/login` `{email, password}`   | navegador                                                                 | 200 `{user:{id,email,username,display_name,role,must_change_password}, access_token_expires_at}` + cookies; 401 `INVALID_CREDENTIALS`; 429 `RATE_LIMITED` (+ `Retry-After`) |
| `POST /auth/refresh`                     | navegador                                                                 | 200 + novos cookies; 401 `UNAUTHORIZED`/`SESSION_EXPIRED`                                                                                                                   |
| `POST /auth/logout`                      | navegador                                                                 | 204 (idempotente) e limpa os cookies                                                                                                                                        |
| `POST /auth/logout-all`                  | navegador                                                                 | 204                                                                                                                                                                         |
| `GET /auth/me`                           | servidor Next (repassa o cookie de access ou usa `Authorization: Bearer`) | 200 `{id,email,username,display_name,role,must_change_password}`; 401                                                                                                       |
| `GET /auth/username-available?username=` | navegador (cadastro)                                                      | 200 `{username, available, reason}` (`reason`: `invalid`/`taken`); 429 com limite por IP                                                                                    |
| `GET /.well-known/jwks.json`             | servidor Next (URL interna)                                               | chaves públicas Ed25519                                                                                                                                                     |

Erros sempre no formato `{"error": {"code", "message"}}`. As rotas de recuperação de senha,
confirmação de email e login social estão na seção "Recuperação de senha, login social e
termos", no fim deste documento.

---

## Cookies

| Cookie                               | Atributos                                             | Visível para              |
| ------------------------------------ | ----------------------------------------------------- | ------------------------- |
| access (`kb_at` / `__Host-kb_at`)    | `HttpOnly; SameSite=Lax; Path=/; Max-Age=TTL (600 s)` | navegador e servidor Next |
| refresh (`kb_rt` / `__Secure-kb_rt`) | `HttpOnly; SameSite=Lax; Path=/auth`                  | **só** as rotas `/auth/*` |

Consequências para o Next:

- O JavaScript nunca lê tokens.
- **O servidor Next nunca vê o cookie de refresh** nas páginas. A renovação sempre parte do navegador: ao receber `401 SESSION_EXPIRED`, ele chama `POST /auth/refresh` e repete a requisição.
- Como o `Max-Age` do access é igual ao TTL, depois da expiração o cookie de access simplesmente some. O servidor deve tratar "sem cookie" como "sessão a renovar no navegador", e não como logout.

---

## Access token (JWT)

- `alg=EdDSA` (Ed25519), com `kid`. Validar com `jose`: `jwtVerify(token, createRemoteJWKSet(jwksUrl), { issuer, audience, algorithms: ['EdDSA'] })`.
- Claims: `sub` (UUID do usuário), `iss`, `aud=knowledge-api`, `iat`, `exp`, `jti`, `role` (`admin` | `user`) e `sid` (sessão).
- A validação local só pela assinatura aceita um token de sessão já revogada até o `exp` (≤ 10 min). Decisões sensíveis (acesso ao `/admin`) usam `GET /auth/me`, que confere a sessão no banco.

---

## Papéis → permissões na Base de Conhecimento

| Papel (AuthService)     | Painel `/admin` e editor `/admin/editor` | Solicitações `/admin/solicitacoes` | Usuários `/admin/usuarios` | `/conta`                          |
| ----------------------- | ---------------------------------------- | ---------------------------------- | -------------------------- | --------------------------------- |
| `admin` (Administrador) | sim                                      | sim                                | sim                        | sim                               |
| `editor` (Editor)       | sim                                      | sim                                | não (403)                  | sim                               |
| `user` (Leitor)         | não (403)                                | não (403)                          | não (403)                  | sim (pode pedir acesso de editor) |

A autorização é sempre decidida no servidor, com o papel e o status atuais vindos de
`GET /auth/me` (o `role` do JWT nunca basta). Esconder links é só UX.

---

## Refresh concorrente

Várias abas podem renovar ao mesmo tempo: reapresentar o refresh token anterior até 10 s depois da rotação é tratado como concorrência legítima (ADR-0008 do AuthService). O cliente ainda deve fazer uma única chamada de refresh por vez dentro da aba.

---

## CSRF

O AuthService recusa mutações cujo `Origin` (ou `Referer`) não esteja em `TRUSTED_ORIGINS`, e recusa cookie sem origem. **Verificado através do rewrite:** o Next repassa o `Origin` do navegador, e a proteção segue ativa (403 para origem estranha e para cookie sem origem).

---

## IP do cliente (rate limit) — requisito de deploy

Verificado: o rewrite do Next (dev e `next start`) **não adiciona** `X-Forwarded-For` e **repassa** o valor enviado pelo cliente.

- Local: `TRUSTED_PROXY_COUNT=0` no AuthService. O IP não pode ser forjado, mas todos os logins aparecem com o IP do Next, e o limite por IP (30/min) vale para todos juntos: 30 tentativas erradas esgotam o limite; da 31ª em diante, qualquer login recebe 429 por até 1 minuto, em qualquer conta (confirmado em 2026-10-14). O mesmo vale para cadastro, recuperação de senha e OAuth. **Não é aceitável em produção.**
- Desde o ADR-0016 do AuthService, há também um limite **por conta** (10 tentativas em 15 min), independente do IP. Desde 2026-10-15, os três limites contam só as tentativas que **falham**: login correto não consome limite, e o bloqueio global por IP passou a exigir 30 falhas por minuto. O IP vindo do `X-Forwarded-For` é validado.
- Produção: só use `TRUSTED_PROXY_COUNT>0` se a camada à frente do Next sobrescrever o `X-Forwarded-For`, ou se o número de saltos tiver sido medido. Valide com `python -m backend.scripts.verify_client_ip` do AuthService, que forja o header e confere o IP gravado. Exemplos de proxy (Caddy, Nginx), passos para o Render e o checklist completo estão em `docs/IMPLANTACAO.md` do AuthService.
- O Next e o AuthService não podem aceitar conexões que não passem pelo proxy de borda: com acesso direto ao Next, o IP forjado é gravado (validado em local em 2026-10-14).

---

## Sessão no servidor (etapa 2)

- `src/features/auth/session.ts` (`server-only`):
  - `verifyAccessToken`: assinatura EdDSA pelo JWKS, com `iss`, `aud`, expiração e claims obrigatórias. Um `kid` desconhecido força a recarga do JWKS remoto (cache de 5 min).
  - `fetchCurrentUser`: `GET /auth/me` com `Authorization: Bearer`, sem cache e com timeout de 5 s.
  - `requireAdmin`: combina as duas funções anteriores.
- **A autorização usa o papel devolvido por `/auth/me`**, que o AuthService confere no banco, e **não** o `role` do JWT. O JWT só serve para descartar tokens inválidos sem consultar o serviço.
- A checagem fica **nas páginas** (`admin/page.tsx`, `admin/editor/page.tsx`), não no layout, como recomenda a documentação do Next 16: layouts não re-renderizam na navegação.
- Comportamento de `requireAdmin`:
  - sem cookie, token inválido ou expirado, ou sessão revogada → `/login?next=<caminho+query>`;
  - papel `user` → `forbidden()` (HTTP 403);
  - AuthService indisponível → erro (falha fechada, nunca libera).
- `src/proxy.ts`: checagem rápida em `/admin/*`. Sem cookie de access, redireciona para o login. **Não é autorização.**
- `next` só aceita caminhos internos (`/…`, nunca `//…` nem URL absoluta), o que evita open redirect.

### Decisão: `forbidden()` experimental

`forbidden()` exige `experimental.authInterrupts` no Next 16, e é a única forma do App Router responder **403 de verdade** numa página. Aceitamos o flag experimental. Se a API mudar numa atualização do Next, os testes de `requireAdmin` e a validação real (403 para `role=user`) acusam.

### Para a etapa 3 (tela de login)

Como o cookie de access expira junto com o token (`Max-Age` = TTL), um usuário com sessão válida pode chegar a `/login?next=...` só porque o access venceu. **A página de login deve primeiro tentar `POST /auth/refresh`** e, se der certo, voltar para `next` sem pedir senha.

---

## Login real (etapa 3)

- `src/features/auth/client.ts` (navegador) chama só `/auth/*` na mesma origem e **nunca lê nem guarda tokens**:
  - `login()`: mapeia 401/429/400/erro de rede para motivos próprios. A tela mostra mensagens próprias, nunca o texto do servidor, e usa `Retry-After` no 429.
  - `refreshSession()`: **uma única requisição por aba**; chamadas simultâneas compartilham a mesma promessa.
  - `logout()`: `POST /auth/logout`, idempotente.
  - `authFetch()`: em `401 SESSION_EXPIRED`, renova uma vez e repete a requisição. Nunca entra em loop. É a base para as futuras chamadas autenticadas à API.
- `/login` (Server Component) valida `next` com `sanitizeNextPath`: só aceita caminhos internos e bloqueia `//`, `/\`, URLs absolutas, caracteres de controle e o próprio `/login`.
- O formulário tenta primeiro renovar a sessão em silêncio. Se conseguir, volta ao `next` sem pedir senha, o que cobre o cookie de access expirado.
- Logout real no botão **Sair** do painel e na página 403 ("Sair e entrar com outra conta"). Sem essa opção no 403, a renovação silenciosa reabriria a mesma sessão.
- Removidos: `src/actions/auth-actions.ts` (hash de `admin@admin.com`), as credenciais exibidas na tela e no README, a "sessão" em `localStorage`/`sessionStorage` e o honeypot do login.
- E2E: `Fluxo 4` usa `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` e é pulado sem elas. Nenhuma credencial fica no código.

---

## Auditoria da integração (antes de novas funcionalidades)

Validada contra a stack real (Next `next start` + AuthService + PostgreSQL), com a
configuração de cookies de produção (`COOKIE_SECURE=true`, `__Host-kb_at`, `__Secure-kb_rt`).

| #   | Achado                                                                                                                                                                                                                                                     | Correção                                                                                                                                                                                                                                                                             |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | AuthService fora do ar tinha dois comportamentos: sem JWKS em cache → mandava ao login como se a sessão tivesse acabado; com cache → erro 500 genérico.                                                                                                    | Falha ao obter o JWKS vira `AuthServiceUnavailableError` (só problemas do próprio token viram "inválido"); `src/app/admin/error.tsx` mostra mensagem própria, código do erro e "Tentar novamente". Nenhum acesso é liberado.                                                         |
| 2   | Com o access expirado, uma navegação no cliente (ex.: "Novo Artigo") ficava presa em "Verificando sessão…": o `router.replace` pós-refresh competia com a navegação do redirect.                                                                           | Fronteiras de autenticação usam navegação completa (`src/lib/navigation.ts`).                                                                                                                                                                                                        |
| 3   | `AUTH_ACCESS_COOKIE_NAME` diferente do cookie do AuthService (ou cookie `Secure` sem HTTPS) gerava loop infinito login ↔ destino (centenas de `/auth/refresh` em segundos).                                                                                | `src/features/auth/return-guard.ts`: se voltamos ao mesmo destino há menos de 15 s e caímos de novo no login, o formulário para, mostra aviso e registra no console a causa provável. Guarda só destino e horário (nada de sessão).                                                  |
| 4   | `logout()` ignorava falhas (rede, 5xx, 403) e o usuário ia ao login com a sessão ainda válida — os cookies são HttpOnly e o navegador não os apaga sozinho.                                                                                                | `logout()` devolve se a sessão foi encerrada (2xx ou 401); em falha, o botão fica na tela e avisa.                                                                                                                                                                                   |
| 5   | As páginas do Next saíam sem headers de segurança: eles só existiam em `vercel.json`/`public/_headers` (herança do Vite), ignorados pelo `next start`. O `vercel.json` ainda tinha o rewrite SPA `/(.*) → /index.html`, que no Vercel desviaria `/auth/*`. | Headers em `next.config.ts` (`src/lib/security-headers.ts`): CSP sem nonce conforme o guia do Next, `frame-ancestors 'none'`, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP e HSTS (fora do dev); `X-Powered-By` removido. Arquivos legados excluídos. |

Verificado sem necessidade de mudança:

- **Concorrência entre abas:** três abas renovando ao mesmo tempo → todas 200 (janela de tolerância do AuthService); na mesma aba, um único refresh.
- **Reinício do AuthService:** sessões persistem no banco; após voltar, "Tentar novamente" recupera sem novo login.
- **Cookies de produção pelo proxy:** `__Host-kb_at` (`Secure; HttpOnly; Path=/; SameSite=Lax`, sem `Domain`) e `__Secure-kb_rt` (`Path=/auth`); nenhum legível por `document.cookie`, nada em `localStorage`/`sessionStorage`.
- **CSRF pelo caminho completo:** `Origin` estranho ou `null` → 403; `Referer` estranho → 403; requisição com cookie de sessão sem `Origin`/`Referer` → 403; corpo não-JSON (`text/plain`, formulário) → 400.
- **CSP:** sem violações em home, artigo, login, `/admin` e `/admin/editor` (inclusive navegação no cliente).

Requisitos de deploy:

- `AUTH_ACCESS_COOKIE_NAME` **igual** a `ACCESS_COOKIE_NAME` do AuthService; prefixos `__Host-`/`__Secure-` exigem HTTPS (o navegador só aceita `Secure` em `http://localhost`).
- `AUTH_ISSUER` igual ao `JWT_ISSUER`; `TRUSTED_ORIGINS` do AuthService com a origem pública do Next.
- IP do cliente: ver a seção "IP do cliente" acima.
- HSTS sem `preload`: incluir na lista de preload é uma decisão à parte, difícil de reverter.

### E2E

`e2e/auth.spec.ts` cobre, contra a stack real: redirecionamento com `next` preservado,
credenciais inválidas, login admin, cookies inacessíveis ao JS, renovação silenciosa
(access removido), logout com revogação, `user` → 403 e troca de conta. Contas por ambiente:

```text
E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_USER_EMAIL, E2E_USER_PASSWORD
AUTH_ACCESS_COOKIE_NAME   # opcional; padrão: qualquer cookie terminado em kb_at
```

O AuthService limita 5 logins/min por e-mail+IP (sucessos contam): a suíte roda só no
projeto chromium e faz um login por teste. Rodar em sequência, em menos de 1 minuto,
pode dar 429.

Falhas E2E **fora** da autenticação, pré-existentes e não tratadas nesta auditoria:
regressão visual (sem baselines) e Fluxos 2 e 3 (Fluxo 3 também no desktop).
O banner de cookies cobrindo o "Entrar" no mobile e o botão de menu sem nome acessível
foram corrigidos na etapa `fix/ux-login-mobile` (`e2e/mobile-ux.spec.ts`).

### Hidratação do `AdminDashboard` (resolvida)

O painel lia `localStorage` durante a renderização e gerava o erro React #418; sob carga,
cliques logo após o carregamento se perdiam. Corrigido com `useBrowserSnapshot`
(`src/hooks/use-browser-snapshot.ts`): servidor e hidratação usam o mesmo valor e, logo
depois, entra o valor do navegador. O mesmo defeito existia em `/minha-lista` (artigos
concluídos e meta de leitura) e foi corrigido igual. A lista de leitura passou a ser um
estado único compartilhado (`useSyncExternalStore`): o contador do menu atualiza na hora ao
salvar um artigo. Varredura com todas as chaves do armazenamento preenchidas: nenhuma página
com divergência de hidratação.

---

## Gestão de usuários e troca obrigatória de senha

Contrato do AuthService: ADR-0009 (branch `feat/gestao-usuarios` do AuthService).

**Autorização (`src/features/auth/session.ts`)**

- `requireSession(path, searchParams, { roles?, allowPendingPasswordChange? })`: sem sessão →
  `/login?next=…`; troca de senha pendente → `/conta/senha?next=…`; papel fora de `roles` → 403.
- A pendência é checada **antes** do papel e vale para toda área protegida (`/admin`,
  `/admin/editor`, `/admin/usuarios`, `/conta`). Só `/conta/senha` abre com ela. Não há rota
  protegida que sirva de atalho: cada página chama `requireSession`/`requireRole`.
- `authorizeAction(roles)`: as mesmas regras para Server Actions, devolvendo o motivo em vez de
  redirecionar (`unauthenticated`, `session_expired`, `password_change_required`, `forbidden`,
  `unavailable`).
- O proxy (`src/proxy.ts`) cobre `/admin/*` e `/conta/*`, só como atalho otimista para o login.

**`/admin/usuarios` (somente admin)**

- Busca no topo (usuário, nome e email; `?q=`, aplicada enquanto se digita, com pausa) e
  lista paginada (20 por página, `?pagina=N`, preservando a busca). Cada linha mostra nome,
  `@usuário` e email juntos.
- Botão **Cadastrar** abre um modal em duas etapas: email e papel; depois usuário (com
  disponibilidade em tempo real) e nome. A senha temporária continua gerada no servidor.
- Troca de papel, desativação/reativação (com confirmação) e redefinição de senha (com
  confirmação).
- Tudo server-side: a página e as Server Actions (`src/app/admin/usuarios/actions.ts` →
  `src/features/auth/user-actions.ts`) chamam `/admin/users` do AuthService **direto do servidor**, com o
  access token do admin como Bearer. Essas rotas não passam pelo proxy `/auth/*` e o token nunca vai
  ao cliente.
- Cada Server Action **reautoriza** no AuthService antes de agir (Server Actions são endpoints
  públicos) e valida a entrada. Access expirado → `session_expired`: o cliente renova via
  `/auth/refresh` e repete a ação uma vez.
- A própria linha do admin fica bloqueada na interface; o servidor também recusa (`self_change`),
  e o AuthService garante ao menos um admin ativo.

**Senha temporária**

- Gerada no servidor do Next (`generateTemporaryPassword`: 16 símbolos sem caracteres ambíguos,
  ~93 bits, em grupos de 4), enviada ao AuthService e devolvida **uma única vez** na resposta da
  Server Action.
- Mostrada numa janela própria, **oculta por padrão** ("Mostrar senha"/"Copiar senha"); vive só no
  estado desse componente e some ao fechar. Não entra no HTML renderizado pelo servidor, na URL,
  em `localStorage`/`sessionStorage` nem em logs (verificado por testes e nos logs reais do Next e
  do AuthService).
- Contas criadas ou redefinidas pelo admin nascem com `must_change_password`; o login já leva
  direto a `/conta/senha?next=…` e, depois da troca, ao destino original.

**Minha conta**

- `/conta`: nome, usuário, email, papel, trocar senha, links do painel conforme o papel, sair.
- `/conta/senha`: senha atual, nova (12–256) e confirmação; valida localmente e envia a
  `POST /auth/password` pelo proxy. As outras sessões do usuário são encerradas.
- Navegação: "Usuários" só para admin (painel e `/conta`); "Minha conta" para qualquer usuário
  autenticado (painel, `/conta`, página 403 e navegação lateral). A navegação lateral consulta
  `GET /api/session`, que sempre responde 200 (sem erro no console para visitantes) e devolve só
  `{ authenticated, email, username, displayName, role, mustChangePassword }` do próprio usuário (mesma origem, sem
  cache) — nunca o token. Não é autorização.

**Limitações conhecidas**

- O validador de email do AuthService recusa domínios reservados (ex.: `.local`); contas novas pela
  interface precisam de um domínio comum. As contas `@teste.local` foram criadas pela CLI.
- Sem envio de email: não há "esqueci minha senha"; a redefinição é feita por um admin.
- `e2e/users.spec.ts` cria uma conta nova a cada execução no banco local.

---

## Cadastro público, pedidos de acesso de editor e usuários de teste

Contrato do AuthService: ADR-0010 (branch `feat/cadastro-e-solicitacoes` do AuthService).

**Cadastro (`/cadastro`)**

- Link "Criar conta" no login (e "Entrar" no cadastro), preservando o `next`.
- Duas etapas: 1) email, senha e confirmação; 2) "Como você quer ser chamado?": usuário e
  nome. A conta só é criada ao concluir a etapa 2 (veja "Usuário e nome de exibição").
- A conta nasce **sempre como Leitor** (`user`): o formulário não tem escolha de papel e o
  AuthService rejeita `role` no corpo. O cadastro já abre a sessão.
- Depende de `PUBLIC_REGISTRATION_ENABLED=true` no AuthService; desligado, a tela avisa.

**Pedido de acesso de editor**

- Em "Minha conta", o leitor clica em "Solicitar acesso de editor". Nada muda no papel até
  alguém decidir; um pedido pendente por vez; depois de recusado, pode pedir de novo.
- `/admin/solicitacoes` (admin **e** editor): lista os pedidos pendentes e permite aprovar ou
  recusar (Server Actions reautorizadas no AuthService). Aprovar torna a pessoa editor e encerra
  as sessões dela; ela entra de novo já como editor.
- O editor não ganha outros poderes: criar contas, mudar papéis livremente, desativar e
  redefinir senha continuam só com o admin.

**Usuários de teste (só desenvolvimento)**

- O `docker compose up` do AuthService cria, se não existirem, um usuário por papel
  (`seed-dev-users`, com `SEED_DEV_USERS=true`). Credenciais no `.env.example` do AuthService:

| Papel         | Email                | Usuário  | Nome          | Senha                |
| ------------- | -------------------- | -------- | ------------- | -------------------- |
| Administrador | `admin@teste.local`  | `admin`  | Administrador | `teste-local-123`    |
| Editor        | `editor@teste.local` | `editor` | Editor        | `editor-local-teste` |
| Leitor        | `user@teste.local`   | `leitor` | Leitor        | `user-local-teste`   |

- Senhas conhecidas de propósito, só para testes locais. Com `ENVIRONMENT=production`, a
  configuração com `SEED_DEV_USERS=true` é rejeitada pelo AuthService.

**Correção: respostas de autenticação sempre lidas por inteiro**

- Achado nesta etapa: o cliente verificava só o status (ex.: `/auth/refresh` do visitante) e não
  lia o corpo. O navegador não dava a requisição por encerrada e segurava a conexão, que tem
  limite por servidor, atrasando as próximas. O mesmo valia para o `fetch` do servidor ao
  AuthService. Agora toda chamada de autenticação (navegador e servidor) consome a resposta;
  há teste de regressão (`bodyUsed`).

**E2E**

- `e2e/signup.spec.ts`: do botão "Entrar" ao cadastro, leitor sem painel, pedido de acesso,
  aprovação por um editor, novo login como editor e email duplicado.
- Variáveis: além de `E2E_ADMIN_*` e `E2E_USER_*`, `E2E_EDITOR_EMAIL`/`E2E_EDITOR_PASSWORD`.
- Localmente, o Playwright roda com 2 workers: com mais, a máquina fica tão disputada que a
  hidratação atrasa e formulários preenchidos cedo demais perdem o conteúdo. Os testes esperam
  a página estável (`e2e/support.ts`) e o sinal de hidratação (`data-testid="account-entry"`).
- A lista de usuários vem dos mais recentes para os mais antigos (conta nova na primeira página).
- Os testes de cadastro e de gestão criam contas `cadastro-*`/`e2e-*` no banco local a cada
  execução (o AuthService não tem exclusão de contas, só desativação).

---

## Usuário e nome de exibição

Contrato do AuthService: ADR-0011 (branch `feat/usuario-e-nome` do AuthService). Esta versão da
Base de Conhecimento exige esse AuthService: sem `username`/`display_name` em `/auth/me`, a
resposta é tratada como fora do contrato (falha fechada) e as áreas logadas ficam indisponíveis.

- **Usuário:** identificador único, de 3 a 30 caracteres (`a-z`, `0-9`, `.`, `-`, `_`; começa
  com letra ou número), gravado em minúsculas. A unicidade é garantida no banco do AuthService
  (`uq_users_username`); a consulta em tempo real é só uma prévia.
- **Nome:** nome de exibição livre (1 a 100 caracteres), sem unicidade.
- Regras espelhadas em `src/features/auth/identity.ts`; a consulta de disponibilidade
  (`useUsernameAvailability`) espera uma pausa na digitação e cancela a anterior.
- Os campos ficam em `src/features/auth/components/IdentityFields.tsx`, usado pelo cadastro público e
  pelo modal do admin. Conflito no envio (409 com `details[0].field`) marca o campo certo:
  usuário ocupado mantém a etapa 2; email ocupado volta à etapa 1.
- Onde aparecem: menu de conta (nome, `@usuário` e email), `/conta`, lista de usuários e
  `/admin/solicitacoes`.
- Contas que já existiam receberam usuário e nome derivados do email pela migration do
  AuthService; as contas de teste foram ajustadas para `admin`, `editor` e `leitor`.

---

## Navegação: menu de conta

- A navegação fica em `src/features/navigation/` (`AppHeader` + `NavDrawer`). No cabeçalho, o
  link fixo de login deu lugar ao menu de conta (`src/features/auth/components/AccountMenu.tsx`),
  passado ao menu por `accountSlot`.
- Visitante: o botão "Entrar ou criar conta" abre "Entrar" e "Criar conta". Com sessão: avatar
  (iniciais), nome, `@usuário` e email, papel, "Minha conta", "Painel" (admin/editor),
  "Usuários" (admin) e "Sair".
- Esc ou clique fora fecha, e o foco volta ao botão. O menu de módulos também fecha com Esc e,
  fechado, sai do Tab (`inert`).
- "Entrar" e "Criar conta" preservam o destino: voltam para a página atual (da página inicial ou
  das telas de acesso, para `/conta`).
- `data-testid="account-menu"` com `data-session="ready"` indica que a página hidratou e
  consultou a sessão; os testes E2E esperam por esse sinal antes de interagir.
- Login e cadastro usam o layout em duas colunas do GitHub (`AuthSplitLayout`). A lógica continua
  a do AuthService. O efeito de imagem só aparece com WebGL disponível.

---

## Recuperação de senha, login social e termos

Regras no AuthService: ADR-0012 (links por email e nomes reservados), ADR-0013 (login
social) e ADR-0014 (termos e perfil opcional).

**Telas novas**

| Rota | O que faz |
| --- | --- |
| `/esqueci-senha` | Pede o link (`POST /auth/password/forgot`). Mensagem sempre igual, exista ou não a conta. |
| `/redefinir-senha#token=` | Nova senha (mínimo de 12 caracteres). O token vem no fragmento e é apagado da barra ao abrir. Ao salvar, todas as sessões caem e a pessoa volta ao login com aviso. |
| `/verificar-email#token=` | Confirma o email ao abrir (`POST /auth/email/verify`). |
| `/cadastro/social` | Última etapa do cadastro social: usuário, nome, perfil opcional e aceite dos termos (`GET /auth/oauth/pending`, `POST /auth/oauth/complete`). |
| `/termos`, `/privacidade` | Documentos com versão (`src/features/legal/documents.ts`). |

**Login e cadastro**

- "Esqueceu a senha?" logo abaixo do campo de senha.
- Botões sociais (`SocialLoginButtons`) acima do formulário, separados por um divisor. Só
  aparecem os provedores configurados no AuthService (`GET /auth/oauth/providers`); sem
  nenhum, a tela fica só com email e senha. Cada botão é um link para
  `/auth/oauth/<provedor>/start?next=`: o AuthService gera `state` e PKCE e redireciona.
- Falhas do login social voltam como `/login?erro=oauth_<motivo>`; a página troca o código
  por uma mensagem fixa (`oauth-errors.ts`).
- Cadastro, etapa 2: perfil opcional (organização, área de atuação) e checkbox obrigatório
  dos termos, com links que abrem em nova aba. A versão lida vai junto; se o AuthService
  tiver outra, a tela pede para recarregar.
- Nomes reservados (`admin`, `suporte`...) são avisados na hora, sem consultar o servidor
  (cópia da lista em `identity.ts`); o AuthService confere de novo.
- Em telas pequenas, a imagem das telas de acesso some e o efeito WebGL nem é carregado.
- Mensagens de erro com contraste AA (`text-red-700`; antes, `text-red-600` sobre o fundo
  rosado dava 3,95:1).

**Minha conta**

- Mostra se o email está confirmado e permite reenviar o link.
- Conta de login social sem senha vê "Criar uma senha" (pelo fluxo de esqueci a senha) no
  lugar de "Trocar senha".

**Cookies do login social:** `kb_oauth_state` e `kb_oauth_signup` (com `__Secure-` em
HTTPS), HttpOnly, `Path=/auth/oauth`, `SameSite=Lax` e curtos (10 e 15 min). Nenhum token
vai para `localStorage`, `sessionStorage` ou URL de consulta.

**Conexões perdidas (ECONNRESET):** o uvicorn fechava conexões ociosas em 5 s, antes do
cliente HTTP do Next; o Next reaproveitava um socket já fechado. O AuthService agora usa
`--timeout-keep-alive 75` (Dockerfile): quem encerra a conexão ociosa é sempre o cliente.

**Testes**

- Unitários (Vitest): `accountRecovery`, `socialAuth`, `legalAndLayout` e os de cadastro.
- E2E: `account-recovery.spec.ts`, `social-auth.spec.ts` e `auth-screens.spec.ts` simulam
  as rotas do AuthService que gravariam algo (`page.route`): não criam contas.
  `signup.spec.ts` e `users.spec.ts` usam a stack real; as contas que criam são apagadas no
  fim pelo `e2e/global-teardown.ts` (comando `delete-e2e-users` do AuthService, que só roda
  em desenvolvimento e só apaga emails `cadastro-<n>@` / `e2e-<n>@exemplo.com.br`).
