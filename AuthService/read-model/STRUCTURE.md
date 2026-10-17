<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=header"/>

<h1 align="center">🏗️ Estrutura e Setup do Projeto</h1>

> **Documento do projeto de origem do AuthService**, mantido como referência histórica; pode não
> refletir esta versão. Documentação atual: [README do AuthService](../README.md),
> [como contribuir](../../CONTRIBUTING.md) e [índice da documentação](../../docs/README.md).

<p align="center">
  <a href="#requisitos">Requisitos</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#setup">Setup</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="#estrutura-de-arquivos">Estrutura</a>&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;
  <a href="../README.md">Voltar</a>
</p>

---

## Requisitos

- Com Docker *(recomendado)*: Docker 24+ e Docker Compose 2+
- Sem Docker: Python 3.11+ e um PostgreSQL acessível (16+)

---

## Setup

O passo a passo completo (Docker, execução local, testes e manutenção) está no [README](../README.md#-como-rodar). Em resumo:

| Ação | Comando |
| --- | --- |
| Gerar a chave de assinatura | `python -m backend.scripts.generate_keys` |
| Aplicar migrations | `alembic upgrade head` |
| Criar o primeiro admin | `python -m backend.cli create-user --email admin@empresa.com --role admin` |
| Subir tudo com Docker | `docker compose up --build` |
| Rodar localmente | `uvicorn backend.main:create_app --factory --reload` |
| Testes | `pytest --cov` (com `TEST_DATABASE_URL`) |
| Limpar sessões expiradas | `python -m backend.cli purge-expired` |

**Após subir, acesse:**

```text
Frontend:  http://localhost:8000
API Docs:  http://localhost:8000/docs
JWKS:      http://localhost:8000/.well-known/jwks.json
Health:    http://localhost:8000/health
```

---

## Estrutura de Arquivos

```text
AuthService/
├── backend/
│   ├── api/
│   │   ├── auth_routes.py         → /auth/login, refresh, logout, logout-all, me
│   │   ├── admin_routes.py        → /admin/users (papel admin)
│   │   ├── system_routes.py       → /.well-known/jwks.json, /health
│   │   ├── cookies.py             → definição e limpeza dos cookies HttpOnly
│   │   ├── middleware.py          → CSRF por Origin/Referer, headers de segurança
│   │   └── error_handlers.py      → formato padrão {"error": {...}}
│   ├── core/                      → config, database, tokens, passwords, rate_limit, errors, logger
│   ├── dependencies/              → identidade atual, require_role, IP do cliente
│   ├── models/                    → users, sessions, refresh_tokens, rate_limit_buckets
│   ├── repositories/              → UserRepository, SessionRepository, RefreshTokenRepository
│   ├── schemas/                   → DTOs de entrada e saída
│   ├── services/                  → AuthService, UserService
│   ├── scripts/                   → generate_keys, export_openapi
│   ├── cli.py                     → create-user, purge-expired
│   └── main.py                    → create_app() (uvicorn --factory)
├── migrations/                    → Alembic (schema auth)
├── tests/                         → pytest contra PostgreSQL real
├── docs/adr/                      → decisões de arquitetura
├── docs/openapi.json              → contrato da API (verificado no CI)
├── frontend/                      → interface de demonstração (HTML/CSS/JS)
└── read-model/                    → documentação complementar e imagens
```

---

## Notas

- O frontend é montado em `/` **depois** das rotas da API; toda rota nova precisa ser registrada antes do mount.
- O container roda como usuário não-root (`app`, uid 10001) e expõe `HEALTHCHECK` em `/health`, que também verifica o banco.
- Migrations são uma etapa de release (`alembic upgrade head`); no Compose, o serviço `migrate` roda antes da API.

<img width=100% src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6&height=120&section=footer"/>
