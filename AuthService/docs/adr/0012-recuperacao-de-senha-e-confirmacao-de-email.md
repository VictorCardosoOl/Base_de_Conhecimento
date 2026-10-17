# ADR-0012: Recuperação de senha, confirmação de email e nomes reservados

- Status: aceito
- Data: 2026-10-08
- Altera: ADR-0010 (o cadastro passa a enviar a confirmação do email), ADR-0011 (nomes reservados)

## Contexto

A tela de login ganhou "Esqueceu a senha?" e o cadastro precisa comprovar a posse do email. Ambos dependem de links enviados por email. A comprovação do email também é a base da regra de vínculo do login social (ADR-0013).

## Decisão

**Links de uso único (`auth.account_tokens`)**

- 256 bits aleatórios (base64url); o banco guarda só o SHA-256, a finalidade (`password_reset` ou `email_verification`), o email de destino, a validade e o uso.
- Validade: 30 min para redefinição (`PASSWORD_RESET_TOKEN_TTL_SECONDS`), 24 h para confirmação (`EMAIL_VERIFICATION_TOKEN_TTL_SECONDS`).
- Uso único: o primeiro uso grava `used_at` sob `SELECT ... FOR UPDATE`; um pedido novo apaga os links pendentes da mesma finalidade.
- O token vai no **fragmento** da URL (`/redefinir-senha#token=...`): não chega a logs de servidor nem ao `Referer`. A página lê o fragmento e o apaga da barra de endereço.
- Se o email da conta não for mais o do link, ele não vale.

**Esqueci a senha (`POST /auth/password/forgot`)**

- Sempre `202` com a mesma mensagem, exista ou não a conta (conta desativada também não recebe nada). O email é enviado em segundo plano (`BackgroundTasks`), então o tempo de resposta não depende do envio.
- Limites: por IP e **por email** (`PASSWORD_RESET_RATE_LIMIT_*`, padrão 10 e 3 por 15 min). O limite por email vale também para email inexistente, para não revelar nada.

**Nova senha (`POST /auth/password/reset`)**

- Mesma política do cadastro (12 a 256 caracteres). Link inválido, usado ou vencido: `400 INVALID_TOKEN`.
- Encerra **todas** as sessões, limpa a troca obrigatória, marca o email como confirmado (o link chegou à caixa de entrada) e avisa o titular por email.
- Uso de links limitado por IP (`TOKEN_CONFIRM_RATE_LIMIT_*`).

**Confirmação de email**

- O cadastro público envia o link. `POST /auth/email/verify` confirma; `POST /auth/email/verification` (com sessão) reenvia, com limite por usuário.
- `UserOut` passa a ter `email_verified` e `has_password`.
- Hoje a confirmação **não bloqueia** o uso: a conta entra como leitor e só ganha a possibilidade de vincular login social. Exigir a confirmação para entrar ou para pedir acesso de editor é uma decisão de produto em aberto.

**Envio de email**

- Interface `EmailSender` com SMTP (qualquer provedor), `memory` (testes) e `disabled`. Nenhuma implementação registra o conteúdo (os links levam tokens); os logs usam um hash curto do destinatário.
- Em produção: `memory` é recusado e SMTP sem TLS também. No docker-compose de desenvolvimento, o Mailpit captura os emails (http://localhost:8025).

**Nomes reservados (`backend/core/reserved_usernames.py`)**

- `admin`, `root`, `suporte`, `seguranca`, `noreply`, nomes de rotas e de papéis etc. A comparação ignora `.`, `-` e `_` (`su.por-te` é reservado).
- Valem nos cadastros feitos pela própria pessoa (público e social): `400 VALIDATION_ERROR` com `field=username`, e a prévia de disponibilidade responde `reason=reserved`. Administradores e a CLI podem usá-los (as contas de teste `admin`, `editor` e `leitor` continuam).

## Trade-offs

- **Contas existentes não confirmadas:** a migration não marca nenhum email como confirmado (não há como saber). Quem já tinha conta confirma pelo reenvio em "Minha conta" ou ao redefinir a senha.
- **Tempo de resposta:** quando a conta existe, o pedido grava um token (alguns milissegundos a mais). O envio, que é o passo lento, fica fora da resposta.
- **Link no fragmento:** exige JavaScript na página de destino, o que a Base de Conhecimento já exige.
