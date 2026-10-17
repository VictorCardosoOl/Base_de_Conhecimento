# Como contribuir

Guia para quem altera o código ou a documentação deste repositório. Para escrever artigos, veja
[BaseCore/docs/INSERCAO_ARTIGOS.md](./BaseCore/docs/INSERCAO_ARTIGOS.md).

## Fluxo de trabalho

1. Atualize a `main` e crie uma branch a partir dela, com um prefixo que diga o tipo da mudança:
   `feat/`, `fix/`, `docs/`, `test/`, `refactor/` ou `chore/` (ex.: `fix/limite-de-login`).
2. Faça a mudança com os testes correspondentes (seção "Testes").
3. Rode localmente as verificações do serviço que mudou (seção "Antes de abrir o PR").
4. Abra um Pull Request para a `main` descrevendo o que mudou, por quê, como testou e se há algo que
   depende da implantação. Peça revisão de alguém da equipe.
5. Só faça o merge com o CI verde e a revisão aprovada. Não use `push --force` na `main`.

## Mensagens de commit

Formato `tipo(escopo): descrição`, em português e no imperativo ou no presente:

```text
fix(auth): limites de login contam só as tentativas que falham
docs(deploy): roteiro do primeiro deploy
feat(conta): botão para sair de todos os dispositivos
```

- Tipos: `feat`, `fix`, `docs`, `test`, `refactor`, `perf`, `build`, `chore`.
- Escopo opcional: a área afetada (`auth`, `conta`, `admin`, `deploy`, `ci`...).
- No corpo, explique o motivo e o efeito quando não for óbvio.
- Um commit por mudança lógica; evite misturar refatoração com correção.

## Testes

- Toda correção de defeito vem com um teste que **falha antes** e passa depois.
- **AuthService:** testes em `AuthService/tests/`, contra um PostgreSQL real. Regressões de autenticação
  ficam em `tests/test_auditoria_autenticacao.py`.
- **BaseCore:** testes de unidade e de componentes em `BaseCore/src/tests/`, organizados como
  `src/features/`. Fluxos de ponta a ponta em `BaseCore/e2e/`.
- Teste instável não se resolve aumentando timeout nem com retry: encontre a causa. Veja
  [docs/TESTES.md](./docs/TESTES.md#instabilidades-conhecidas-e-por-quê).
- Mudou a API do AuthService? Regenere o contrato: `python -m backend.scripts.export_openapi`.

## Antes de abrir o PR

| Serviço | Na pasta do serviço |
| --- | --- |
| BaseCore | `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` |
| AuthService | `ruff check backend migrations tests`, `ruff format --check backend migrations tests`, `mypy`, `pytest` |

Se mudou fluxos de tela, rode também o E2E ([docs/TESTES.md](./docs/TESTES.md#e2e-playwright)).

### Hooks de commit (husky)

A pasta `BaseCore/.husky/` tem um `pre-commit` que roda `npx lint-staged`, e o `package.json` da BaseCore
tem a configuração do lint-staged. **Hoje esse hook não roda:** husky e lint-staged não estão instalados nas
dependências, e nada configura o `core.hooksPath` do Git. Por isso, rode as verificações da tabela acima
manualmente. O prettier está instalado, mas `npm run format:check` ainda acusa arquivos fora do padrão e não
faz parte do CI. Instalar os hooks e padronizar a formatação estão registrados como pendência no
[CHANGELOG](./CHANGELOG.md).

## CI

Cada serviço tem o próprio workflow em `.github/workflows/`, que só roda quando a pasta dele muda:

| Workflow | Roda quando muda | O que verifica |
| --- | --- | --- |
| `ci-quality-gates.yml` | `BaseCore/` | lint, tipos, testes com cobertura, build, `npm audit` e varredura de segredos; E2E sob demanda |
| `ci-authservice.yml` | `AuthService/` | ruff, mypy, migrations (ida, volta e ida), pytest com cobertura, build da imagem e gitleaks (só os commits do push ou do pull request) |
| `codeql.yml` | `AuthService/` | análise de segurança do código Python |

## Segredos

- **Nunca** versione `.env`, `.env.local`, `.env.e2e.local`, a pasta `keys/` ou chaves `.pem`. Os
  `.gitignore` da raiz e de cada serviço já os ignoram; confira com `git status` antes de cada commit.
- Exemplos de configuração vão só no `.env.example` do serviço, com valores fictícios.
- Não coloque token, senha ou chave em mensagens de commit, logs, issues ou documentação.
- Se um segredo for parar no Git, avise a equipe e troque o segredo (apagar o commit não basta).

## Documentação

- Mudou um comportamento? Atualize o documento correspondente na mesma mudança
  ([índice](./docs/README.md)).
- Decisão de arquitetura nova: crie um ADR em `docs/adr/` seguindo o formato dos existentes e acrescente-o
  ao [índice dos ADRs](./docs/adr/README.md).
- Textos em português, objetivos, e comandos só depois de executados.
