# Plano de Auditoria Estática Profunda e Code Review (DevSecOps)

## 1. Visão Geral da Arquitetura e Stack
- **Monorepo / Workspace:**
  - `apps/web`: Next.js 16 (App Router, Turbopack, React 19, Tailwind CSS, TypeScript).
  - `apps/api`: FastAPI (Python 3.12, SQLAlchemy, Alembic, PostgreSQL, Pydantic, OAuth2 / JWT, argon2).
  - `deploy`: Docker Compose (dev/prod), Caddyfile, Nginx config, Render manifest.
  - `scripts`: Utilitários de build, migração e catálogo.
- **Objetivo da Auditoria:**
  - Identificar vulnerabilidades de segurança (XSS, IDOR/BOLA, Hardcoded Secrets, CORS/Cookies, RLS).
  - Analisar conformidade arquitetural (12-Factor App, Dependências com lockfiles/ranges, separação stateless).
  - Mapear problemas de Clean Code, concorrência, race conditions, leaks de memória e dead code.

---

## 2. Escopos de Inspeção & Estratégia de Execução

### Fase 1: Auditoria de Segurança e Backend (`apps/api`)
1. **Configurações e Hardcoded Secrets:**
   - Varredura em `apps/api/backend/core/config.py`, `.env.example`, `docker-compose.yml`.
   - Inspeção de chaves JWT, segredos OAuth, credenciais SMTP e chaves de banco de dados.
2. **Autenticação, Sessões e Tokens:**
   - `apps/api/backend/core/tokens.py`, `passwords.py`, `cookies.py`, `oauth.py`.
   - Validação de flag HttpOnly, Secure, SameSite, expiração de JWT, grace period de refresh e revogação.
3. **Controle de Acesso, IDOR/BOLA e Permissões:**
   - `apps/api/backend/api/admin_routes.py`, `auth_routes.py`, `content_routes.py`, `system_routes.py`.
   - Inspeção de injeção de dependências (`dependencies.py`), verificação de roles no servidor e integridade de tenant/usuário.
4. **Segurança de Banco de Dados e Sanitização:**
   - `apps/api/backend/models/`, queries SQLAlchemy, migrações Alembic e prevenção de SQL Injection.

### Fase 2: Auditoria de Frontend e Integrações (`apps/web`)
1. **Controle de Acesso e Autenticação Client-Side:**
   - `apps/web/src/features/auth/`, middleware Next.js (`middleware.ts`), `apps/web/src/app/api/session/route.ts`.
   - Verificação de bypass de telas de login / admin por manipulação de estado do cliente.
2. **Sanitização de Dados e XSS:**
   - `apps/web/src/features/articles/sanitize-html.ts`, renderização de Markdown (`ArticleContent.tsx`, marked, DOMPurify).
   - Uso de `dangerouslySetInnerHTML` e validação de URLs externas / SVG.
3. **Gerenciamento de Estado, Concorrência e Memory Leaks:**
   - Event listeners de janela/scroll/resize, abort controllers em `fetch`, cleanups em `useEffect`.
   - Hooks customizados em `apps/web/src/features/*/hooks/`.
4. **Clean Code, Peso Morto e Resíduos:**
   - Mapeamento de imports não utilizados, arquivos órfãos, `console.log` residuais e tipos redundantes.

### Fase 3: Auditoria de Infraestrutura, Deploy e Dependências (`deploy`, raiz, configs)
1. **12-Factor App e Statelessness:**
   - Persistência local vs. cloud storage para uploads ou dados voláteis.
   - Variáveis de ambiente dinâmicas vs. hardcoded endpoints (`localhost`, portas fixas).
2. **Gerenciamento de Dependências e Supply Chain:**
   - `package.json`, `apps/web/package.json`, `requirements.txt`, `pyproject.toml`.
   - Análise de pinagem de versão, pacotes deprecated ou conflitantes.
3. **Configuração de Infraestrutura e Containers:**
   - `Dockerfile`, `docker-compose*.yml`, `Caddyfile`, `nginx.conf`.
   - Headers de segurança (CSP, HSTS, X-Content-Type-Options, Referrer-Policy).

---

## 3. Entregáveis
- `walkthrough.md`: Relatório completo estruturado em Task Lists com criticidade, localização exata (`caminho:linha`), explicação técnica e correção proposta.
- Modo de Operação: Estritamente **Read-Only** (nenhum código em produção será alterado nesta etapa).
