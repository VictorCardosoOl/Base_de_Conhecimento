<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=header"/>

<h1 align="center">📚 Documentação Arquitetural</h1>

> **Documento do projeto de origem do AuthService**, mantido como referência histórica; pode não
> refletir esta versão. Documentação atual: [README do AuthService](../README.md),
> [como contribuir](../../CONTRIBUTING.md) e [índice da documentação](../../docs/README.md).

<p align="center">
  <a href="#visão-geral">Visão Geral</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#modelo-de-dados">Modelo de Dados</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#fluxos">Fluxos</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="../README.md">Voltar</a>
</p>

---

## Visão Geral

O **AuthService** é o provedor de identidade: responde *quem é o usuário*. Decidir *o que ele pode fazer* em cada recurso cabe a quem consome o token (por exemplo, a Knowledge API), a partir da claim `role`. O detalhamento e as alternativas de cada decisão estão em [`docs/adr/`](../docs/adr).

```text
HTTP ─▶ middlewares (headers de segurança, CSRF por Origin, CORS opcional)
     ─▶ api/*_routes.py       controllers: validam DTOs, chamam serviços, definem cookies
     ─▶ dependencies          identidade atual (cookie ou Bearer), exigência de papel
     ─▶ services              regras: login, refresh rotativo, reuso, logout, usuários
     ─▶ repositories          acesso a dados (SQLAlchemy)
     ─▶ PostgreSQL (schema auth)
```

| Módulo | Responsabilidade |
| --- | --- |
| `core/config.py` | Configuração tipada, validada no boot (sem segredos com valor padrão) |
| `core/tokens.py` | JWT EdDSA, `kid` RFC 7638, JWKS, refresh token opaco e seu hash |
| `core/passwords.py` | Argon2id, verificação fictícia para usuário inexistente, rehash |
| `core/rate_limit.py` | Interface `RateLimiter` e implementação em PostgreSQL |
| `core/logger.py` | Logs com redação de segredos e sem quebra de linha injetada |
| `api/middleware.py` | Defesa CSRF por Origin/Referer e headers de segurança |

---

## Modelo de Dados

| Tabela | Campos principais | Observações |
| --- | --- | --- |
| `auth.users` | `id` (UUID), `email` (único, normalizado), `password_hash`, `role` (`admin`/`user`), `is_active`, `last_login_at` | `CHECK` de papel e de normalização do email |
| `auth.sessions` | `id` (UUID), `user_id`, `expires_at` (absoluto), `revoked_at`, `revoked_reason`, `ip_address`, `user_agent` | Uma por login; é a "família" dos refresh tokens |
| `auth.refresh_tokens` | `id`, `session_id`, `token_hash` (SHA-256, único), `expires_at`, `used_at`, `replaced_by_id` | `used_at` preenchido = já rotacionado |
| `auth.rate_limit_buckets` | `key` (SHA-256), `window_start`, `count`, `expires_at` | Janela fixa, compartilhada entre instâncias |

Todos os timestamps são `timestamptz` em UTC. O esquema é versionado com Alembic e nunca é criado no boot.

---

## Fluxos

### Login

```text
1. POST /auth/login {email, password}; campos extras são rejeitados
2. Rate limit por IP e por IP + email (429 + Retry-After se excedido)
3. Busca o usuário pelo email normalizado
   - não existe  → verificação Argon2 contra hash fictício → 401 INVALID_CREDENTIALS
   - senha errada ou usuário inativo → 401 INVALID_CREDENTIALS (mesma resposta)
4. Cria a sessão e o refresh token (grava só o hash); emite o access token EdDSA
5. Define os cookies HttpOnly; o corpo traz apenas {user, access_token_expires_at}
```

### Refresh (rotação e detecção de reuso)

```text
1. POST /auth/refresh com o cookie de refresh (Path=/auth)
2. Localiza o token pelo hash, com SELECT ... FOR UPDATE
3. Token já usado:
   - é o anterior e foi rotacionado há ≤ 10 s → concorrência legítima (outra aba) → novo par
   - caso contrário → revoga a sessão inteira (refresh_token_reuse) → 401
4. Sessão revogada → 401; token ou sessão expirados → 401 SESSION_EXPIRED
5. Usuário inativo → revoga a sessão → 401
6. Emite novo refresh e novo access token; marca o anterior como usado
```

### Acesso autenticado

O access token vem do cookie ou de `Authorization: Bearer`. Em `/auth/me` e nas rotas de admin, o AuthService também confere se a sessão (`sid`) segue ativa e se o usuário continua ativo. O papel usado na autorização vem do banco, não do token.

### Logout

`POST /auth/logout` revoga a sessão identificada pelo refresh token (ou pelo `sid` do access token) e limpa os cookies. É idempotente. `POST /auth/logout-all` revoga todas as sessões do usuário.

---

> **Limitações conhecidas**
>
> - Consumidores que validam o JWT só pela assinatura aceitam um token de sessão revogada até o `exp` (no máximo o TTL do access token).
> - Um token roubado e usado até 10 s depois da rotação legítima não é detectado como reuso (trade-off do ADR-0008).
> - Ainda não há recuperação de senha, MFA nem gestão de usuários pela interface.

<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=footer"/>
