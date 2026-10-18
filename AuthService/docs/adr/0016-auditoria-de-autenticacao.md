# ADR-0016: Correções da auditoria de autenticação (limite por conta, IP validado, troca de senha imposta no servidor)

- Status: aceito
- Data: 2026-10-14
- Relatório: `docs/AUDITORIA_AUTENTICACAO.md`

## Contexto

A auditoria de 2026-10-14 confirmou três falhas no ambiente local (Next 16 → AuthService em Docker):

1. **Bloqueio global do login.** Atrás do rewrite do Next, todas as requisições chegam com o IP do Next. Com `TRUSTED_PROXY_COUNT=0`, o limite por IP (30/min) virou um limite único para todos: 30 tentativas erradas esgotam o limite; da 31ª em diante, qualquer login recebe 429 por até 1 minuto, em qualquer conta (reproduzido com emails inexistentes). Com `TRUSTED_PROXY_COUNT>0` sem um proxy de borda que sobrescreva o `X-Forwarded-For`, o IP é forjável e os limites por IP e por IP+email deixam de proteger uma conta.
2. **`X-Forwarded-For` não validado.** Um valor que não é IP virava chave de limite e ia para `sessions.ip_address` (`String(45)`). Um valor longo gerava erro 500 no login.
3. **Troca de senha temporária só imposta pelo cliente (ADR-0009).** Desde o ADR-0015, as rotas `/content/*` são chamadas direto pelo navegador. Uma sessão aberta com a senha definida por um administrador, que portanto a conhece, podia comentar, avaliar, sugerir correções, pedir o papel de editor e usar a API administrativa sem trocar a senha.

## Decisão

- **Limite por conta, independente do IP:** `login-account` = SHA-256 do email normalizado, padrão de 10 tentativas em 15 minutos (`LOGIN_RATE_LIMIT_ACCOUNT_ATTEMPTS`, `LOGIN_RATE_LIMIT_ACCOUNT_WINDOW_SECONDS`). Vale também para emails inexistentes, para não revelar quais existem. Soma-se aos limites por IP e por IP+email.
- **IP validado:** o valor escolhido do `X-Forwarded-For` passa por `ipaddress.ip_address`, que o normaliza. Um valor inválido é descartado: vale o IP da conexão e fica registrado `client_ip_forwarded_invalid` no log.
- **Troca imposta no servidor:** a dependência `get_active_user` recusa com `403 PASSWORD_CHANGE_REQUIRED` enquanto `must_change_password` for verdadeiro. Ela é usada nas escritas de `/content`, em `POST /auth/role-request` e em `require_role`, que cobre toda a API administrativa e a moderação. Continuam liberados `/auth/me`, a leitura de conteúdo, `POST /auth/password`, logout e refresh.
- **Avisos de implantação:** em produção, o boot registra `deployment_warning` quando `TRUSTED_PROXY_COUNT=0` ou `OPENAPI_ENABLED=true`. São avisos e não erros, porque a topologia só é conhecida na implantação.

## Trade-offs

- **Bloqueio de conta por terceiros:** o limite por conta permite que alguém bloqueie o login de uma pessoa específica por até 15 minutos, enviando senhas erradas para o email dela. É o custo aceito para impedir força bruta distribuída. A janela é curta e o bloqueio é por conta, não global. A recuperação de senha continua disponível.
- **Requisito de implantação, que o código não resolve:** o limite global por IP só desaparece com um proxy de borda que **sobrescreva** o `X-Forwarded-For` e com `TRUSTED_PROXY_COUNT` ajustado. A validação é feita com uma requisição que forja o header (ADR-0006).
- **Contrato:** novo código de erro `PASSWORD_CHANGE_REQUIRED` (403). Antes, clientes de terceiros com a troca pendente conseguiam gravar. A Base de Conhecimento já bloqueava essas ações, então nada muda para ela.

## Atualização 2026-10-14 (Etapa 2: implantação e operação)

- **Proxy de borda:** exemplos versionados em `deploy/` na raiz do repositório (Caddy e Nginx) que substituem o `X-Forwarded-For`, para usar com `TRUSTED_PROXY_COUNT=1`.
- **Verificação:** `python -m backend.scripts.verify_client_ip` faz um login real com `X-Forwarded-For` forjado e confere o IP gravado. Validado em local: pelo Caddy, o IP forjado é ignorado; com acesso direto ao Next, o forjado é gravado (por isso só o proxy pode alcançar o Next).
- **Render:** o comportamento do proxy não está documentado oficialmente (relatos indicam que ele acrescenta ao `X-Forwarded-For`). Fica **não verificado** até a medição no primeiro deploy (`docs/IMPLANTACAO.md`). Um cabeçalho dedicado (`True-Client-IP`) fica como opção a avaliar depois da medição, sem implementação.
- **OpenAPI:** sem valor, desligado em produção e ligado em desenvolvimento.
- **Limpeza:** `purge-expired` agendado (perfil `ops` do compose; Cron Job no Render; cron no Linux).

## Atualização 2026-10-15 (D1: só as falhas contam)

- **Defeito encontrado na auditoria de login:** os três limites (por IP, por IP + email e por conta) eram incrementados antes de conferir a senha, então logins corretos também contavam. Uma pessoa que entrava 10 vezes em 15 min, sem errar, recebia `429`; e, atrás do proxy, 30 logins corretos por minuto de quaisquer pessoas bloqueavam todos.
- **Correção:** o login consulta os três limites **sem contar** (`RateLimiter.peek`) e recusa com `429` se algum estiver esgotado (durante o bloqueio, nem a senha correta passa). Só uma tentativa que falha incrementa os contadores. Os limites e as janelas não mudaram.
- **Risco aceito:** consulta e contagem não são atômicas. Tentativas simultâneas podem passar alguns pontos do limite antes de o bloqueio valer.
- **F1:** o bloqueio global por IP atrás do proxy agora exige 30 **falhas** por minuto (antes, 30 tentativas de qualquer tipo). Continua possível de propósito, então segue dependendo do proxy de borda (`docs/IMPLANTACAO.md`).
