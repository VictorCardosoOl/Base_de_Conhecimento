# ADR-0013: Login social (OAuth 2.0 com PKCE)

- Status: aceito
- Data: 2026-10-08

## Contexto

Login e cadastro com Google e GitHub, numa arquitetura que aceite outros provedores (Microsoft, Facebook...). O AuthService continua sendo o único emissor de sessões: o provedor só comprova a identidade.

## Decisão

**Fluxo (Authorization Code + PKCE S256 + `state`)**

1. `GET /auth/oauth/{provedor}/start?next=` gera `state` (256 bits) e `code_verifier` (PKCE), guarda o hash do `state` com o verificador em `auth.oauth_states` (10 min) e o próprio `state` num cookie HttpOnly (`Path=/auth/oauth`, `SameSite=Lax`). Redireciona ao provedor com `code_challenge`.
2. `GET /auth/oauth/{provedor}/callback` exige o `state` da URL **igual** ao do cookie (impede login CSRF) e existente no banco; o registro é apagado antes de falar com o provedor (uso único). Troca o código com o `code_verifier` e lê o perfil.
3. Tudo termina num redirecionamento (303) para o site: o destino, `/cadastro/social` ou `/login?erro=oauth_<motivo>`.

A URL de retorno é `{PUBLIC_APP_URL}/auth/oauth/{provedor}/callback`: passa pelo rewrite do Next, então cookies continuam first-party.

**Regra de vínculo (sem sequestro de conta)**

- Vínculo existente (provedor + `subject` estável, nunca o email) → entra na conta.
- O provedor precisa afirmar que o email está **verificado** (Google: `email_verified`; GitHub: email principal verificado). Sem isso → recusa.
- Existe conta com o mesmo email:
  - com o email **já confirmado** na conta → vincula e entra; o titular recebe um aviso por email;
  - com o email **não confirmado** → recusa (`oauth_link_requires_verification`). Quem criou a conta pode não ser o dono do email (pré-sequestro); o titular entra com a senha, confirma o email e então o login social passa a funcionar.
- Um vínculo por provedor por conta; um `subject` só pertence a uma conta.

**Cadastro por login social**

- Sem conta → cadastro pendente (`auth.oauth_pending_signups`, 15 min, cookie HttpOnly). Nenhuma conta nem sessão existe ainda.
- `/cadastro/social` mostra o email do provedor e pede usuário, nome e o aceite dos termos (ADR-0014). `POST /auth/oauth/complete` cria a conta **sempre `user`**, sem senha (`password_hash` nulo), com o email já confirmado, vincula o provedor e abre a sessão.
- Só com `PUBLIC_REGISTRATION_ENABLED=true`. Limite por IP igual ao do cadastro.
- Conta sem senha: o login por senha responde como senha errada (mesmo custo); "Esqueceu a senha?" cria uma.

**Extensibilidade**

- `backend/core/oauth.py`: cada provedor é uma subclasse de `OAuthProvider` (endpoints, escopos, leitura do perfil), registrada em `PROVIDER_CLASSES`; as credenciais são `OAUTH_<ID>_CLIENT_ID/SECRET`. Provedor sem credenciais fica desligado e não aparece em `GET /auth/oauth/providers`.
- O cliente HTTP é injetável (os testes não acessam a internet) e só aceita HTTPS.

## Trade-offs

- **Perfil pelo endpoint de userinfo** (e não validando o `id_token`): o token de acesso vem direto do provedor por TLS, no back-channel, o que dispensa a validação da assinatura do `id_token` neste fluxo.
- **Sem desvincular pela interface (ainda):** desvincular exige garantir que a conta mantenha outro meio de acesso (senha ou outro provedor).
- **Recusa em vez de vínculo automático** para contas com email não confirmado: um pouco menos cômodo, muito mais seguro.
