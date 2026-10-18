# 🗒️ Changelog

---

## 2.0.0 (2026-10-15)

Primeira versão com a Base de Conhecimento e o AuthService no mesmo repositório
([ADR-0017](./docs/adr/0017-monorepo.md)).

### Estrutura

- A Base de Conhecimento foi movida para `BaseCore/`; o AuthService entrou em `AuthService/`, sem o
  histórico do projeto de origem; exemplos de proxy em `deploy/`; documentação geral e ADRs novos em `docs/`.
- `docker-compose.yml` na raiz sobe banco, AuthService, Mailpit e a Base. A BaseCore ganhou `Dockerfile`.
- CI separado por serviço, com filtro por caminho (`ci-quality-gates.yml`, `ci-authservice.yml`,
  `codeql.yml`). A varredura de segredos (gitleaks) olha só os commits de cada push ou pull request.
- `AuthService/.env.example` alinhado à BaseCore e ao compose da raiz: `AUTH_PORT=8010` e
  `JWT_ISSUER=http://localhost:8010`, sem ajuste manual.

### Autenticação e contas

- Login, cadastro, recuperação de senha, confirmação de email e login social (OAuth com PKCE) pelo
  AuthService; sessão em cookies `HttpOnly` (`kb_at` em `/`, `kb_rt` em `/auth`) com refresh rotativo e
  renovação silenciosa ([docs/AUTENTICACAO.md](./docs/AUTENTICACAO.md)).
- Papéis (administrador, editor, leitor) verificados no servidor a cada acesso; gestão de usuários e pedidos
  de acesso de editor.
- Botão "Sair de todos os dispositivos" em Minha conta, com a explicação de que limpar só parte dos dados do
  site não encerra a sessão.
- **Build sem `AUTH_*` (2026-10-17):** o `next build` falhava sem as variáveis de autenticação (como no CI e
  na Vercel), ao pré-renderizar `/conta`. As 6 páginas protegidas e `/api/session` passaram a ser dinâmicas e
  leem a configuração só em tempo de requisição. Sem configuração válida, falham fechadas: nenhuma rota
  protegida concede acesso, as Server Actions respondem "indisponível" e o servidor registra o motivo no
  log. Com as variáveis definidas, o comportamento não muda.

### Correções da auditoria de autenticação (2026-10-14 e 2026-10-15)

- **F1 (mitigada):** limite de login por conta (10 falhas a cada 15 min), independente do IP. O bloqueio
  global por IP atrás do proxy depende da hospedagem (pendências).
- **F2:** um `X-Forwarded-For` que não é IP não vai mais para o banco nem derruba o login (antes, erro 500).
- **F3:** a troca da senha temporária passou a ser imposta também no servidor:
  `403 PASSWORD_CHANGE_REQUIRED` nas escritas, no pedido de editor e na API administrativa.
- **D1:** os limites de login (por IP, por IP + email e por conta) contam só as tentativas que falham. Antes,
  logins corretos também contavam e bloqueavam quem entrava várias vezes.
- **D2:** uma volta legítima ao mesmo destino pelo login, em menos de 15 s, não é mais tratada como loop.
- **D3:** corrigido o erro de hidratação (React #418) nas páginas de artigo.
- Mensagens de espera do `429` em minutos acima de 60 s, no login, na troca de senha e no cadastro.
- `OPENAPI_ENABLED` desligado por padrão em produção; avisos no boot para configurações perigosas.

### Conteúdo e leitura

- Avaliações, sugestões de correção e comentários reais nos artigos.
- Páginas institucionais (Termos de Uso, Privacidade, Preferências de Cookie) e página Sobre.
- Removidos 3 artigos, como na versão publicada (`4e4fade`): "Rotina de Transmissão dos Eventos de SST ao
  eSocial", "Sistema Tributário e Seu Impacto Nas Notas Fiscais" e `esocial-sst-transmission`. Junto, saíram
  as 3 URLs do `sitemap.xml` e o artigo da trilha "Transmissão e Eventos eSocial".

### Operação e documentação

- Checklist e roteiro do primeiro deploy, verificação de IP forjado (`verify_client_ip.py`) e limpeza
  periódica (`purge-expired`): [AuthService/docs/IMPLANTACAO.md](./AuthService/docs/IMPLANTACAO.md).
- Testes do Vitest estáveis: o paralelismo foi limitado a metade dos núcleos.
- Documentação nova: [docs/README.md](./docs/README.md) (índice), guia de autenticação, guia de testes,
  solução de problemas, glossário, índice dos ADRs e [CONTRIBUTING.md](./CONTRIBUTING.md).
- README da raiz reescrito (2026-10-17): propósito original do projeto, arquitetura, início rápido,
  testes, segurança, implantação e licenças por pasta. Novo [CONTRIBUTORS.md](./CONTRIBUTORS.md), com os
  colaboradores e as origens que recebem crédito.
- Revisão editorial da documentação (2026-10-17): padrão visual do README original aplicado aos READMEs e
  guias, ADRs com formato uniforme e índice com as relações declaradas, e correções factuais conferidas no
  código (versão dos termos, campos padrão dos artigos, papéis, limites e códigos de erro do AuthService,
  nome do aplicativo instalável e rodapé que prometia uso offline).

### Validação (2026-10-15 a 2026-10-17)

pytest 301 (cobertura de 97%), Vitest 502, tsc e ESLint sem erros, build com e sem as variáveis `AUTH_*`
(90 páginas estáticas, mesma lista de rotas) e E2E com 58 testes passando, contra a pilha do compose da raiz. Detalhes e instabilidades em
[docs/TESTES.md](./docs/TESTES.md).

### Riscos conhecidos

- **Bloqueio de conta por terceiros:** quem souber um email pode bloquear o login dessa conta por até 15 min.
- **Corrida não atômica nos limites:** tentativas simultâneas podem passar alguns pontos do limite.
- **F1:** sem proxy de borda que sobrescreva o `X-Forwarded-For`, 30 falhas por minuto de quaisquer pessoas
  bloqueiam o login de todos por até 1 minuto.
- O limite de troca de senha conta todas as tentativas, inclusive as corretas (5 por minuto).

### Pendências

- **Os 3 artigos apagados no `4e4fade`:** confirmar com o Victor que a remoção foi intencional (e, junto, a
  saída da trilha e do sitemap).
- **F1 e hospedagem:** medir o `TRUSTED_PROXY_COUNT` no primeiro deploy com `verify_client_ip.py`. O
  comportamento do proxy do Render não foi verificado.
- **Snapshot visual mobile:** a referência mobile da home (`home-desktop-layout-mobile-chrome-win32.png`)
  está desatualizada. (O teste "Introdução Artística", que apontava para um módulo que não existe mais,
  foi removido nesta versão.)
- **Data em inglês** no card "Atualizados recentemente" ("04 Sep 2026"); os demais usam o formato em
  português.
- **Versão do Node:** CI e Docker usam 22, e a máquina de desenvolvimento usa 24.11. Alinhar.
- **Hooks de commit e formatação:** husky e lint-staged não estão instalados, então o `pre-commit` não
  roda. O prettier está instalado, mas `npm run format:check` acusa 224 arquivos fora do padrão
  (2026-10-15) e não faz parte do CI.
- **Serviço `purge` (perfil `ops`):** herda o healthcheck HTTP da imagem do AuthService e aparece como
  `unhealthy` no `docker compose ps`, embora rode a limpeza normalmente. Desligar o healthcheck nesse
  serviço.
- **Markdownlint no CI:** desde 2026-10-17 os documentos não têm avisos, mas o CI não roda o lint de
  Markdown; uma regressão só aparece se alguém rodar o `markdownlint` localmente.
- **Melhorias futuras:** tela de sessões ativas, checagem de senha vazada e MFA para administradores.
