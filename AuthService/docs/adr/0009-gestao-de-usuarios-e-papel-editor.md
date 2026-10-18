# ADR-0009: Gestão de usuários pelo admin e papel editor

- Status: aceito
- Data: 2026-09-27
- Complementa: ADR-0001 (sem cadastro público), ADR-0004 (sessões)

## Contexto

A Base de Conhecimento precisa de uma área de gestão de usuários. O AuthService só permitia criar e listar contas (`POST`/`GET /admin/users`) e tinha dois papéis (`admin`, `user`). Faltavam: um papel intermediário para quem produz conteúdo, alterar papel, desativar/reativar, redefinir senha e trocar a própria senha.

Decisões do responsável pelo produto: **contas continuam sendo criadas por um administrador** (sem cadastro público, sem envio de e-mail) e os papéis passam a ser **admin, editor e user**.

## Decisão

**Papéis**

- `admin`: gerencia usuários e conteúdo. `editor`: cria e edita conteúdo, não gerencia usuários. `user`: consulta.
- Só `admin` acessa `/admin/*` do AuthService. O que cada papel faz na Base de Conhecimento é decidido lá, a partir do papel devolvido por `/auth/me`.

**Senha definida por terceiros exige troca**

- Nova coluna `users.must_change_password`. Contas criadas pela API admin e senhas redefinidas pelo admin nascem com `true`; a troca pelo próprio usuário (`POST /auth/password`) volta para `false`.
- O campo aparece em `/auth/me` e na resposta de login/refresh. **Quem impõe a troca é o cliente** (a Base de Conhecimento redireciona para a troca antes de liberar o resto). O AuthService não bloqueia outras rotas: o valor é informativo e a sessão continua válida. **Substituído em parte pelo ADR-0016:** o servidor recusa as escritas (`/content`, pedido de editor, API administrativa) com `403 PASSWORD_CHANGE_REQUIRED` até a troca.
- Contas criadas pela CLI (bootstrap do primeiro admin, operador digitando a própria senha) nascem com `false`.

**Alterações que mudam o poder da sessão revogam as sessões do usuário**

- Mudar o papel, desativar ou redefinir a senha revoga todas as sessões do alvo (`role_changed`, `user_deactivated`, `password_reset`). O access token em circulação carrega o papel antigo; consumidores que confiam só no JWT (sem consultar `/auth/me`) veriam o papel antigo por até `ACCESS_TOKEN_TTL_SECONDS`. Com a revogação, o próximo refresh falha e o usuário entra de novo com o papel novo.
- Reativar não cria sessões; o usuário faz login.
- Trocar a própria senha revoga **as demais** sessões (`password_changed`) e mantém a atual.

**Proteções**

- Um admin não altera o próprio papel, não se desativa e não redefine a própria senha pela rota administrativa (usa `POST /auth/password`, que exige a senha atual).
- Sempre resta **ao menos um admin ativo**: a alteração bloqueia (`SELECT … FOR UPDATE`) os admins ativos antes de decidir, então duas alterações simultâneas não levam a zero admins.
- `POST /auth/password` exige sessão, origem confiável (CSRF, ADR-0005), senha atual correta e nova senha diferente e dentro da política. Tentativas contam no mesmo limite do login por usuário (`LOGIN_RATE_LIMIT_ATTEMPTS` por `LOGIN_RATE_LIMIT_WINDOW_SECONDS`).
- Usuário desativado recebe no login a mesma resposta de credenciais inválidas (não revela o estado da conta).
- Logs registram quem alterou quem e o quê, nunca senhas.

## Consequências

- Contrato: `UserOut` (login, refresh, `/auth/me`) ganha `must_change_password`; novas rotas `PATCH /admin/users/{id}`, `POST /admin/users/{id}/password` e `POST /auth/password`; novo código de erro HTTP 404 `NOT_FOUND` em rotas de usuário. `docs/openapi.json` atualizado.
- Clientes que validam o papel contra uma lista fechada precisam aceitar `editor` antes de existir um editor (a Base de Conhecimento é ajustada na etapa seguinte).
- Recuperação de senha por e-mail ("esqueci minha senha") continua fora do escopo: sem envio de e-mail, a redefinição é feita por um admin.
