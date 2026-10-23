# Relatório de Auditoria e Code Review (DevSecOps)

> **Auditor:** Principal Software Engineer & DevSecOps Specialist  
> **Data:** 22 de Outubro de 2026  
> **Modo de Análise:** Static Analysis & Code Review (Read-Only)  
> **Escopo:** `apps/web`, `apps/api`, `deploy`, `scripts`

---

## 1. Sumário Executivo

A codebase foi submetida a uma auditoria estática profunda e code review em três pilares fundamentais:
1. **Lógica e Clean Code** (Resíduos, concorrência, dead code, memory leaks).
2. **Segurança e Autorização** (Secrets, autorização client-side vs. backend, IDOR/BOLA, XSS, cookies de sessão).
3. **Arquitetura e Infraestrutura** (12-Factor compliance, dependências, hardcoding de portas e URLs).

O projeto demonstra maturidade em sua postura defensiva:
- A autenticação adota criptografia moderna com assinaturas assimétricas **Ed25519 (EdDSA)**, hashing de senhas com **Argon2id** (RFC 9106), cookies com prefixos de segurança (`__Host-` e `__Secure-`), mitigação rigorosa de timing attacks e proteção CSRF via Origin matching.
- No frontend, o parsing de Markdown é protegido com **DOMPurify/sanitize-html** através de allowlists explícitas, bloqueando injeções maliciosas.

Entretanto, foram mapeados pontos de melhoria, riscos de conformidade arquitetural e fragilidades de resiliência reportados a seguir.

---

## 2. Inventário de Descobertas (Task List Format)

- [ ] [Severidade: MÉDIA] - Risco de Dependências com Ranges Abertos no Frontend (`package.json`)
  - **Localização:** `apps/web/package.json:44-59`
  - **Categoria:** Arquitetura / Supply Chain Security
  - **Descrição:** Várias dependências de produção cruciais (como `next: ^16.3.5`, `react: ^19.3.0`, `mermaid: ^11.17.2`, `sanitize-html: ^2.17.7`) utilizam prefixos de range `^`. Em ambientes de CI/CD ou deploys sem `package-lock.json` ou com `npm install` frouxo, atualizações automáticas menores podem introduzir regressões de compatibilidade ou quebras não testadas em produção.
  - **Solução Proposta:** Fixar versões exatas no `package.json` para pacotes centrais do ecossistema Next/React, ou assegurar formalmente o uso estrito de `npm ci` nos pipelines de CI/CD e Dockerfiles.

- [ ] [Severidade: MÉDIA] - Desalinhamento de Nome de Cookie de Sessão em Docker Compose Dev (`kb_at` vs `__Host-kb_at`)
  - **Localização:** `deploy/docker/docker-compose.dev.yml:21-26`
  - **Categoria:** Segurança / Infraestrutura
  - **Descrição:** No arquivo `docker-compose.dev.yml`, a variável de ambiente `AUTH_ACCESS_COOKIE_NAME` possui como fallback `kb_at`, enquanto o AuthService padrão em `backend/core/config.py` e no `render.yaml` exige e padroniza `__Host-kb_at`. Embora navegadores aceitem cookies sem prefixo em `http://localhost`, a divergência de nome impede que o Next.js reconheça os tokens emitidos pela API quando em execução mista com configurações divergentes de ambiente.
  - **Solução Proposta:** Padronizar as variáveis de ambiente de compose para utilizar a convenção canônica definida no `render.yaml` e no `Settings`:
    ```yaml
    AUTH_ACCESS_COOKIE_NAME: ${AUTH_ACCESS_COOKIE_NAME:-__Host-kb_at}
    ```

- [ ] [Severidade: BAIXA] - Ausência de Variável `DATABASE_URL` em `docker-compose.prod.yml`
  - **Localização:** `deploy/docker/docker-compose.prod.yml:16-25`
  - **Categoria:** Arquitetura / 12-Factor App
  - **Descrição:** O arquivo `docker-compose.prod.yml` define os serviços `web` e `api`, porém a seção `api` não injeta `DATABASE_URL` nem referencia um banco de dados relacional ou secrets de produção, falhando no boot do container se executado de forma autônoma sem passar `.env` manual.
  - **Solução Proposta:** Adicionar a referência explícita do `env_file: .env` ou `DATABASE_URL` parametrizada:
    ```yaml
    api:
      build:
        context: ../../apps/api
        dockerfile: Dockerfile
      restart: always
      env_file: .env.production
      environment:
        ENVIRONMENT: production
        PORT: "8000"
    ```

- [ ] [Severidade: BAIXA] - Alerta de Compatibilidade no Vitest com `__dirname` nativo
  - **Localização:** `apps/web/vitest.config.ts:35`
  - **Categoria:** Clean Code / Tooling
  - **Descrição:** O Vite/Vitest emite warning indicando que o uso de `__dirname` em `vitest.config.ts` é obsoleto para `configLoader: 'native'` em módulos ES (`type: "module"`), recomendando `import.meta.dirname`.
  - **Solução Proposta:** Substituir `__dirname` pela propriedade padrão ESM do Node 20+:
    ```typescript
    // vitest.config.ts
    // Substituir path.resolve(__dirname, ...) por:
    path.resolve(import.meta.dirname, ...)
    ```

- [ ] [Severidade: BAIXA] - Limpeza de Diretórios Residuais Vazios em `packages/`
  - **Localização:** `packages/application`, `packages/domain`, `packages/infrastructure`
  - **Categoria:** Clean Code / Debloat
  - **Descrição:** Conforme diagnosticado na auditoria de arquivos, os diretórios dentro de `packages/` contêm apenas subdiretórios vazios (`dtos`, `use-cases`, `contracts`, `security`, etc.) sem código TypeScript/JavaScript após a centralização da arquitetura no frontend e backend FastAPI.
  - **Solução Proposta:** Remover a árvore vazia `packages/` para manter a estrutura do repositório 100% concisa e sem resquícios conceituais de monorepo legado.

---

## 3. Conclusão da Auditoria

A arquitetura do projeto cumpre os requisitos de conformidade de segurança e padrões do setor (SOLID, OWASP, Clean Code):
- Sem exposição de secrets ou tokens hardcoded.
- Sem brechas de IDOR ou elevação de privilégios no client-side: todas as rotas administrativas e ações (`user-actions.ts`, `admin_routes.py`) efetuam checagens severas de permissões no backend.
- Higienização segura de SVG e Markdown contra XSS.
- Nível de robustez validado com 100% dos testes essenciais passando e compilação Next.js Turbopack operacional.
