# ADR-0010: Cadastro público, pedidos de acesso de editor e usuários de teste

- Status: aceito
- Data: 2026-09-28
- Altera: ADR-0001 e ADR-0009 (antes, só o admin criava contas)

## Contexto

O responsável pelo produto pediu uma página de cadastro. Até aqui não havia cadastro público: contas eram criadas por um admin. Também pediu que o usuário comum não possa se promover, que a promoção a editor seja feita por um admin ou por qualquer editor, e que o usuário possa **pedir** esse acesso dentro do sistema. Por fim, pediu usuários de teste de cada papel já cadastrados para o ambiente local.

## Decisão

**Cadastro público (`POST /auth/register`)**

- A conta nasce **sempre** com papel `user`. O corpo aceita só `email` e `password` (campos extras, como `role`, são rejeitados). O papel nunca vem do cliente.
- Senha escolhida pela própria pessoa: `must_change_password = false`. O cadastro já abre a sessão (mesmos cookies do login).
- Chave `PUBLIC_REGISTRATION_ENABLED`, **desligada por padrão**: sem ela, a rota responde 404. Cada ambiente decide explicitamente.
- Limite por IP (`REGISTER_RATE_LIMIT_IP_ATTEMPTS` em `REGISTER_RATE_LIMIT_WINDOW_SECONDS`) e defesa CSRF por origem (ADR-0005).

**Pedido de acesso de editor**

- `POST /auth/role-request`: só contas `user`; um pedido pendente por vez (índice único parcial no banco). `GET /auth/role-request` mostra a situação do último pedido.
- `GET /admin/role-requests`, `POST …/{id}/approve`, `POST …/{id}/reject`: **admin ou qualquer editor**. Um usuário comum não vê nem decide pedidos, nem o próprio.
- Aprovar só vale para conta `user` ativa (senão, 409); muda o papel para `editor`, revoga as sessões do usuário (`role_changed`, como no ADR-0009) e registra quem decidiu e quando. Pedido decidido não é decidido de novo (bloqueio `FOR UPDATE`).
- Depois de uma recusa, o usuário pode pedir de novo.
- O editor **não** ganha outros poderes de gestão: criar, alterar papel livremente, desativar e redefinir senha continuam só com o admin (ADR-0009).

**Usuários de teste (`python -m backend.cli seed-dev-users`)**

- Cria um usuário por papel (admin, editor, user) com `SEED_<PAPEL>_EMAIL`/`_PASSWORD`. Roda no serviço `migrate` do `docker compose`, depois das migrations.
- Só com `SEED_DEV_USERS=true`; com `ENVIRONMENT=production` a configuração é **rejeitada** (e o comando recusa, como defesa extra).
- Idempotente: conta que já existe não é alterada (nem papel, nem senha).
- As senhas de teste estão no `.env.example` de propósito, marcadas como exclusivas de desenvolvimento.

## Trade-offs

- **Enumeração de contas:** o cadastro responde 409 para email já existente, o que revela que a conta existe. Mitigado pelo limite por IP; a alternativa (resposta genérica + email de confirmação) exige envio de email, que o projeto não tem.
- **Sem verificação de email:** qualquer endereço pode ser cadastrado. Como a conta nasce `user` (somente leitura) e a promoção passa por um admin/editor, o impacto é limitado.
- **Limite por IP atrás do Next:** com `TRUSTED_PROXY_COUNT=0`, todos os cadastros chegam com o IP do Next e dividem o mesmo limite (ADR-0006). Em produção, configure o proxy confiável.
