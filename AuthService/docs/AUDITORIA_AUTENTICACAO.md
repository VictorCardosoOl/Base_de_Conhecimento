# 🛡️ Auditoria técnica do sistema de autenticação

> **Relatório datado.** Registra o estado de 2026-10-14 e as correções feitas em seguida. O funcionamento atual
> está em [docs/AUTENTICACAO.md](../../docs/AUTENTICACAO.md) e as pendências, no [CHANGELOG](../../CHANGELOG.md).

- Data: 2026-10-14
- Escopo: AuthService (FastAPI, branch `fix/auditoria-autenticacao` a partir de `feat/conteudo-interacoes`) e a integração com a Base de Conhecimento (Next 16, branch `fix/auditoria-autenticacao` a partir de `feat/refatoracao-ux`).
- Ambiente: execução local (Docker Desktop no Windows). O banco de testes é descartável (`authservice-testdb`). Os testes manuais usaram contas de teste ou emails inexistentes (`*@exemplo.test`). Nenhuma conta real foi alterada.
- Referências: OWASP ASVS 4.0.3 (V2 Autenticação, V3 Sessão, V4 Acesso, V11 Lógica de negócio), OWASP Top 10 2021 (A01, A04, A05, A07) e OWASP Authentication Cheat Sheet.

**Legenda.** **Confirmado**: reproduzido com teste automatizado ou requisição real, evidência citada. **Provável**: decorre do código lido, sem reprodução. **Não verificado**: depende de algo fora do alcance, como a topologia de produção.

---

## 1. Resumo executivo

A base é sólida. Senhas usam Argon2id. O access token é um JWT EdDSA curto, em cookie `HttpOnly`. O refresh token é opaco, rotativo e com detecção de reuso. Há CSRF por Origin, OAuth com `state` e PKCE, tokens de conta guardados como hash e de uso único, e a sessão é conferida no banco a cada requisição.

A auditoria **confirmou três falhas** e corrigiu as três no código:

| # | Falha | Severidade | Situação |
| --- | --- | --- | --- |
| F1 | Atrás do rewrite do Next, o limite de login "por IP" é **um limite global**. 30 tentativas erradas esgotam o limite; da 31ª em diante, qualquer login recebe 429 por até 1 minuto, em qualquer conta. Se o operador "consertar" isso com `TRUSTED_PROXY_COUNT>0` sem proxy de borda, o IP fica forjável e não há limite por conta. | **Alta** | Mitigada no código: limite por conta e aviso no boot. A causa raiz depende da **implantação** (ver §8). |
| F2 | Um `X-Forwarded-For` que não é IP vai para o banco e vira chave de limite. Um valor longo causa **erro 500** no login. | Média | Corrigida |
| F3 | A troca obrigatória da senha temporária só era imposta pela Base. Com essa senha, conhecida pelo admin que a definiu, a sessão gravava conteúdo, pedia o papel de editor e usava a API administrativa. | Média | Corrigida |

A preocupação levantada na reunião de 2026-10-13 ("limpei os dados do site e continuei logado") foi reproduzida. **Não é uma falha**: o que ela mostra está explicado no §5, D4.

---

## 2. Arquitetura atual

```text
Navegador ──(mesma origem)──► Next 16 (Base de Conhecimento, :3000)
                                 ├─ páginas /conta, /admin: requireSession() no servidor
                                 │     JWT verificado via JWKS + GET /auth/me (papel e status do banco)
                                 └─ rewrites /auth/*, /content/* ─► AuthService (FastAPI, :8010→8000)
                                                                      └─ PostgreSQL (schema auth)
```

- **AuthService:** camadas `api` (rotas, cookies, middleware CSRF, handlers de erro), `dependencies`, `services` (`AuthService`, `AccountService`, `OAuthService`, `UserService`, `ContentService`), `repositories` e `models`. Alembic cuida das migrations.
- **Credenciais e tokens:**
  - **Senha:** Argon2id, com parâmetros mínimos validados em produção.
  - **Access token:** JWT EdDSA de 10 min no cookie `__Host-kb_at` (em local, `kb_at`; path `/`).
  - **Refresh token:** opaco, guardado como SHA-256, no cookie `__Secure-kb_rt` (em local, `kb_rt`; path `/auth`). Dura 7 dias, e a sessão no máximo 30.
- **Base:**
  - `proxy.ts` faz uma checagem otimista do cookie.
  - `session.ts` faz a decisão real no servidor e usa o AuthService como fonte de verdade para papel e status.
  - `authFetch` renova a sessão uma vez em caso de `SESSION_EXPIRED`.
  - Nenhum token fica em `localStorage`, `sessionStorage` ou JavaScript.

---

## 3. Funcionamento de ponta a ponta

1. **Login** (`POST /auth/login`):
   1. Aplica os limites. O IP vem de `get_client_info`.
   2. Busca o usuário. Se o email não existe ou não tem senha, faz uma verificação falsa para não revelar isso pelo tempo de resposta.
   3. Verifica a senha. Conta inativa responde o mesmo 401 genérico.
   4. Refaz o hash se os parâmetros mudaram e abre a sessão (refresh + access).
   5. Responde 200, define os cookies e devolve `UserOut`.
2. **Requisição autenticada:**
   1. `get_current_user` decodifica o JWT (assinatura, `iss`, `aud`, `exp`).
   2. `resolve_user` confere no banco a sessão (não revogada, não expirada) e o usuário (ativo).
   3. A partir do ADR-0016, `get_active_user` também recusa quem tem a troca de senha pendente.
3. **Refresh** (`POST /auth/refresh`):
   1. Trava o token e a sessão com `FOR UPDATE`.
   2. Um token já usado dentro da janela de tolerância (corrida entre abas) devolve a sessão vigente. Fora dela, conta como reuso: revoga a sessão e responde 401.
   3. Token expirado: `SESSION_EXPIRED`.
4. **Logout:** revoga a sessão e limpa os cookies. É idempotente. **Logout-all** revoga todas as sessões; a partir de agora há um botão em "Minha conta".
5. **Recuperação de senha:** responde sempre 202. O token tem 30 min, é de uso único e vai no fragmento da URL. A redefinição revoga as sessões.
6. **OAuth:** `state` em cookie e no banco, PKCE e proteção contra pre-hijack. Uma conta local com email não confirmado não é vinculada automaticamente.

---

## 4. Regras de negócio (implementadas e verificadas pelos testes)

- Cadastro público sempre cria o papel `user`. Para virar editor, a pessoa pede e um admin aprova.
- Contas criadas ou com senha redefinida por um admin nascem com `must_change_password=true`.
- Trocar a própria senha exige a senha atual e encerra as outras sessões.
- Papel e status vêm sempre do banco. O papel dentro do JWT não basta para autorizar.
- Limites de login (contam só as tentativas que falham, desde 2026-10-15; um login correto não consome limite):
  - por IP: 30/min;
  - por IP + email: 5/min;
  - **novo:** por conta, 10 a cada 15 min, independente do IP.
- Também há limites no cadastro, na recuperação de senha, na confirmação de token e no OAuth, e por pessoa nas interações de conteúdo.

---

## 5. Divergências entre o esperado e o implementado

| # | Esperado | Encontrado | Classificação | Evidência |
| --- | --- | --- | --- | --- |
| D1 | O limite por IP isola clientes | Atrás do Next, todos os clientes compartilham o IP do proxy | **Confirmado** | `auth.sessions.ip_address`: todas as sessões têm o IP do Next (rede Docker). Logins com emails inexistentes: os 30 primeiros receberam `401` e o 31º, `429`. Outro email recebeu 429 em seguida. |
| D2 | O ADR-0006 e o `INTEGRACAO_AUTH.md` diziam que `TRUSTED_PROXY_COUNT=0` "é seguro" | É seguro contra IP forjado, mas permite bloqueio global (negação de serviço) | **Confirmado** | Igual a D1. A documentação foi corrigida. |
| D3 | `must_change_password` bloqueia o uso da conta | Só a Base bloqueava; o servidor aceitava escritas | **Confirmado** | Testes `test_troca_pendente_*`, que falhavam antes da correção. |
| D4 | "Limpar os dados do site desloga" | Apagar só o `kb_at`, ou só o armazenamento local, mantém a pessoa logada. Limpar tudo desloga. | **Confirmado (comportamento esperado)** | Playwright, 5 cenários (abaixo). |
| D5 | `X-Forwarded-For` é tratado como IP | Qualquer texto era aceito; um valor longo causava erro 500 | **Confirmado** | Teste parametrizado. O log mostrava `unhandled_error POST /auth/login` antes da correção. |

**D4 em detalhe.** Os cenários rodaram contra a pilha local:

| Cenário | Resultado |
| --- | --- |
| Apagar `localStorage` e `sessionStorage` | Continua logado. Nada da sessão fica ali, por decisão de projeto. |
| Apagar só o cookie `kb_at` | Continua logado. A tela de login renova a sessão sozinha usando o `kb_rt`. |
| `Storage.clearDataForOrigin` com "all" | Sem cookies. `/conta` redireciona para `/login`. |
| Apagar todos os cookies | Redireciona para `/login`. |
| Logout | 204, cookies removidos, redireciona para `/login`. |

O refresh token (`kb_rt`) fica no path `/auth`. Por isso algumas ferramentas do navegador não o mostram ao inspecionar a página, e ele sobrevive a uma limpeza parcial. É o comportamento padrão de sessão longa ("continuar conectado"). Encerrar a sessão de verdade exige o logout, que revoga no servidor, ou o novo "Sair de todos os dispositivos".

---

## 6. Auditoria de segurança

| Área (ASVS) | Resultado |
| --- | --- |
| V2.1 / V2.4: senhas | ✅ Mínimo de 12 caracteres, máximo de 256, Argon2id e rehash. ⚠️ Não há checagem contra senhas vazadas (V2.1.7). Recomendação. |
| V2.2: proteção contra automação | ❌→✅ F1/F2. Agora há limite por conta e o IP é validado. ⚠️ O limite global por IP persiste até a implantação corrigir o `X-Forwarded-For` (exemplos de proxy e script de verificação em `docs/IMPLANTACAO.md`). |
| V2.5: recuperação de credenciais | ✅ Resposta 202 uniforme, token de uso único e curto, fora da query string, e revogação das sessões. |
| V3.2 / V3.3: sessão | ✅ Rotação do refresh, detecção de reuso, expiração absoluta, logout e logout-all no servidor. ✅ Agora há interface para logout-all. ⚠️ Não há lista de sessões ativas para a pessoa ver. |
| V3.4: cookies | ✅ `HttpOnly`, `Secure` e prefixos `__Host-`/`__Secure-` em produção (validados no boot), `SameSite`. |
| V4.1 / V4.2: controle de acesso | ✅ Papel vindo do banco. ❌→✅ F3. |
| V4.2.2 / A01: CSRF | ✅ Origin/Referer obrigatórios nas mutações com cookie. Teste existente confirma o 403. |
| V7: logs | ✅ Sem senha, token ou hash nos logs. Erro 500 genérico. ✅ Novo registro `client_ip_forwarded_invalid`. |
| V13 / V14: configuração | ✅ `OPENAPI_ENABLED` sem valor fica desligado em produção e ligado em desenvolvimento; ligado em produção gera aviso. ⚠️ No compose de desenvolvimento, a porta da API ficava aberta em todas as interfaces (corrigido: `127.0.0.1`). |
| A07: enumeração | ✅ Login e recuperação não revelam se o email existe. O limite por conta vale também para emails inexistentes (teste). ⚠️ O cadastro responde 409 para email já usado: escolha deliberada, com limite. |
| OAuth (Cheat Sheet) | ✅ `state` e PKCE, redirecionamento validado, sem vínculo automático com email não confirmado. |

---

## 7. Qualidade e dívida técnica

- **Pontos fortes:**
  - camadas bem separadas;
  - hierarquia `AppError` com códigos estáveis;
  - configuração tipada e validada em produção;
  - ADRs mantidos;
  - 283 testes no AuthService antes da auditoria, usando um banco real descartável.
- **Dívidas encontradas:**
  - `docker-compose.yml`: o serviço `db` não tinha `restart`. Depois de reiniciar o Windows, o banco ficou parado e o AuthService sem banco. **Corrigido.**
  - `purge-expired` (limpeza de sessões e tokens vencidos) existia sem agendamento. **Corrigido:** serviço `purge` no perfil `ops` do compose e instruções para o Render e para cron (`docs/IMPLANTACAO.md`).
  - Os testes ficam sensíveis à ordem dos limites, porque os buckets ficam no banco. A fixture `configure` isola bem cada teste.
  - A sessão `203.0.113.99 / teste-xff-forjado` no banco local veio de um teste anterior (ADR-0006). Não tem efeito; ela expira sozinha.

---

## 8. Plano de correção (priorizado)

| Prioridade | Item | Situação |
| --- | --- | --- |
| Crítica | Nenhum item crítico encontrado | n/a |
| Alta | F1: limite por conta, independente do IP | ✅ Feito |
| Alta | D1 (2026-10-15): os limites contavam também os logins corretos | ✅ Corrigido: só as falhas contam |
| Alta | F1: **requisito de implantação**. Pôr um proxy de borda (Caddy, Nginx, CDN) que **sobrescreva** o `X-Forwarded-For`, definir `TRUSTED_PROXY_COUNT=1` e validar com um header forjado (o IP gravado não pode ser o forjado) | ✅ Exemplos (`deploy/`) e script `verify_client_ip`, validados em local. ⏳ Em produção depende da hospedagem: **não verificado** (medição descrita em `docs/IMPLANTACAO.md`). |
| Média | F2: validação do IP | ✅ Feito |
| Média | F3: troca de senha imposta no servidor | ✅ Feito |
| Média | Avisos no boot (`TRUSTED_PROXY_COUNT=0`, `OPENAPI_ENABLED`) | ✅ Feito |
| Média | Interface para "Sair de todos os dispositivos" | ✅ Feito |
| Baixa | Restart do `db` e porta em `127.0.0.1` no compose | ✅ Feito |
| Baixa | Agendar `purge-expired`; OpenAPI desligado por padrão em produção | ✅ Feito (Etapa 2) |
| Baixa | Lista de sessões ativas, checagem de senha vazada, MFA para admins | 📋 Recomendação (avaliação no §12) |

---

## 9. Alterações realizadas

**AuthService:**

- `backend/services/auth_service.py`: terceiro limite no login, `login-account`, com janela própria.
- `backend/core/config.py`: `LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS` (10) e `LOGIN_RATE_LIMIT_ACCOUNT_WINDOW_SECONDS` (900).
- `backend/dependencies/dependencies.py`:
  - `_valid_ip`: o IP do `X-Forwarded-For` é validado e normalizado; um valor inválido é descartado e registrado no log;
  - `get_active_user`;
  - `require_role` passa a depender de `get_active_user`.
- `backend/core/errors.py`: `PASSWORD_CHANGE_REQUIRED` e `PasswordChangeRequiredError` (403).
- `backend/api/content_routes.py`: as escritas (avaliar, remover avaliação, sugerir correção, comentar, editar e remover comentário) usam `get_active_user`.
- `backend/api/auth_routes.py`: `POST /auth/role-request` usa `get_active_user`.
- `backend/main.py`: `deployment_warnings()` é registrado no boot em produção.
- `docker-compose.yml`: `db` com `restart: unless-stopped`; a porta da API vai só para `127.0.0.1`.
- `.env.example`: novas variáveis, comentadas.
- ADRs: novo ADR-0016; notas de atualização no 0006 e no 0009.
- `tests/test_auditoria_autenticacao.py`: 13 testes.

**Base de Conhecimento:**

- `src/features/content/content-client.ts`: o código `PASSWORD_CHANGE_REQUIRED` vira a mensagem "Troque a senha temporária em Minha conta antes de continuar."
- `src/features/auth/client.ts`: `logoutAll()` (`POST /auth/logout-all`, renovando a sessão uma vez se preciso).
- `LogoutButton` ganhou `scope="all"`. `/conta` ganhou o botão "Sair de todos os dispositivos".
- `docs/INTEGRACAO_AUTH.md`: corrigida a afirmação de que `TRUSTED_PROXY_COUNT=0` "é seguro".
- Testes: `client.test.ts` (2 novos) e `interactions.test.tsx` (1 asserção).

O contrato da API só ganhou o novo código de erro. Nenhuma rota, campo ou migration mudou, e `docs/openapi.json` foi regenerado sem diferenças.

**Etapa 2 (implantação e operação), AuthService:**

- `backend/core/config.py`: `OPENAPI_ENABLED` sem valor resolve pelo ambiente (desligado em produção). Teste em `tests/test_email_and_config.py`.
- `backend/scripts/verify_client_ip.py`: verificação com `X-Forwarded-For` forjado. A senha vem só de `VERIFY_PASSWORD`.
- `deploy/Caddyfile.example` e `deploy/nginx.conf.example` (na raiz do repositório, desde o monorepo): proxy de borda que substitui o `X-Forwarded-For`.
- `docker-compose.yml`: serviço `purge` (perfil `ops`, laço diário), fora do `up` padrão.
- `docs/IMPLANTACAO.md` (novo): checklist de produção, Render, medição do número de saltos e agendamento.
- Texto do limite por IP corrigido (30 tentativas esgotam o limite; 429 a partir da 31ª) neste relatório, nos ADRs 0006 e 0016 e no `INTEGRACAO_AUTH.md` da Base.

---

## 10. Testes e validação (resultados reais desta execução)

| Verificação | Resultado |
| --- | --- |
| Testes novos **antes** da correção | 10 falharam e 3 passaram. Esperado: eles reproduzem as falhas. |
| `pytest` AuthService (completo) | **296 passaram** (283 anteriores + 13 novos) |
| `ruff check`, `ruff format`, `mypy backend` | Sem problemas |
| `docker compose config` | Válido |
| `vitest` Base | **477 passaram** (41 arquivos) |
| `tsc --noEmit`, `eslint` nos arquivos alterados, `next build` | Sem erros |
| Login pela pilha local (Next → AuthService), email inexistente | `401×5`, depois `429` (limite IP + email). O limite por conta só aparece quando o IP muda, situação coberta pelo teste automatizado com `X-Forwarded-For` rotativo. |
| "Sair de todos os dispositivos" (Playwright, 2 sessões da conta de teste E2E) | O dispositivo A volta para `/login` sem cookies. No dispositivo B, `POST /auth/refresh` responde 401 e `/conta` redireciona para `/login?next=%2Fconta`. |

**Etapa 2 (implantação e operação):**

| Verificação | Antes | Depois |
| --- | --- | --- |
| `pytest` AuthService | 296 passaram | **297 passaram** (+1: padrão do OpenAPI por ambiente) |
| `ruff check` e `ruff format --check` | Sem problemas | Sem problemas |
| `mypy backend` | 57 arquivos, sem problemas | 58 arquivos (+ script), sem problemas |
| `vitest` Base | 477 passaram (41 arquivos) | 477 passaram. Numa execução intermediária, 1 teste de `navigation.test.tsx` falhou e passou em 3 reexecuções isoladas e numa nova execução completa. Instável, sem relação com a etapa (nenhum código da Base mudou). |
| `tsc`, `eslint`, `next build` | 0 erros; 16 avisos de lint; build OK (103 páginas) | Iguais |
| `verify_client_ip` pelo Caddy (`TRUSTED_PROXY_COUNT=1`) | n/a | `OK: IP gravado 172.17.0.1`; forjado ignorado |
| `verify_client_ip` direto no Next com cabeçalho forjado | n/a | `FALHA: o IP gravado é o forjado` (esperado) |
| `purge-expired` pelo perfil `ops` | n/a | Executou no banco local: 0 sessões, 389 contadores e 1 link temporário removidos |

A validação local usou um backup do `.env` e reverteu tudo ao final: o hash do `.env` voltou a ser o mesmo, `TRUSTED_PROXY_COUNT=0`, o container foi reconstruído com o código da branch, e o container e a imagem do Caddy foram removidos. As duas sessões criadas pelo script foram encerradas (`revoked_reason=logout`).

Um caso de teste foi trocado durante a execução: `"não-é-ip"` virou `"nao-e-ip"`. Cabeçalhos HTTP só aceitam ASCII, e o cliente de teste se recusava a enviar o valor original. A falha era do teste, não do servidor.

---

## 11. Estado final

- As três falhas confirmadas estão corrigidas no código e cobertas por testes de regressão.
- **Risco residual (alta, depende da implantação):** enquanto não houver um proxy de borda que sobrescreva o `X-Forwarded-For`, os limites por IP continuam funcionando como limite global. O login de todos ainda pode ser bloqueado por 1 minuto de cada vez, agora só com 30 **falhas** por minuto (D1). A força bruta contra uma conta, por sua vez, agora está contida pelo limite por conta. A configuração e a verificação estão prontas e validadas em local; falta medir na hospedagem escolhida (`docs/IMPLANTACAO.md`, §4).
- Novo trade-off aceito: alguém pode bloquear o login de uma pessoa específica por até 15 minutos. A recuperação de senha continua disponível (ADR-0016).
- Na época da auditoria, as alterações estavam só em branches locais dos dois repositórios. Desde 2026-10-15, fazem parte do monorepo (`AuthService/` e `BaseCore/`, ADR-0017 em [`../../docs/adr/0017-monorepo.md`](../../docs/adr/0017-monorepo.md)).

---

## 12. Recomendações futuras

1. **Na implantação:** seguir o checklist de `docs/IMPLANTACAO.md` (proxy de borda, medição de `TRUSTED_PROXY_COUNT` com `verify_client_ip`, agendamento do `purge-expired`, nenhum `deployment_warning` no boot).
2. Itens avaliados e fora do escopo até agora:

   | Item | Prós | Contras | Esforço |
   | --- | --- | --- | --- |
   | Tela de **sessões ativas** | A pessoa vê e encerra um acesso indevido (ASVS V3.3.4) | Rota nova de listagem e revogação; mostra IP (dado pessoal, LGPD); o user agent precisa ser legível | Médio, 1 a 2 dias |
   | Checagem de **senha vazada** (HIBP k-anonymity) | Bloqueia senhas conhecidas (ASVS V2.1.7) | Chamada externa no cadastro e na troca, latência e plano para quando a API cair; com lista local, um arquivo grande. Dependência nova: decidir antes | Baixo a médio, 0,5 a 1 dia |
   | **MFA (TOTP)** para administradores | Reduz muito o risco de conta admin comprometida | Migration, cadastro com QR, códigos de recuperação, login em duas etapas e suporte a perda do aparelho | Alto, 3 a 5 dias |

3. Alertas de volume de 429 e de `refresh_token_reuse_detected` nos logs.
4. Ao migrar `/content` para uma Knowledge API própria (ADR-0015), manter a checagem de `must_change_password`. O JWT não carrega esse estado.
