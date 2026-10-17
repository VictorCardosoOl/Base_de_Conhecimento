# ADR-0006: Rate limiting de login em PostgreSQL, com interface substituível

- Status: aceito
- Data: 2026-09-27

## Decisão

- Janela fixa, compartilhada entre instâncias via tabela `rate_limit_buckets` (upsert atômico `INSERT ... ON CONFLICT ... RETURNING`).
- Dois limites no login, configuráveis: por IP + email (padrão 5/min) e por IP (padrão 30/min). Excesso gera `429 RATE_LIMITED` com `Retry-After`.
- As chaves são o SHA-256 do identificador: o banco não guarda IP nem email em claro.
- A contagem usa transação própria, então persiste mesmo quando o login falha.
- O IP do cliente considera `X-Forwarded-For` só quando `TRUSTED_PROXY_COUNT > 0`, evitando falsificação do header.

## Por que não memória local

Com várias instâncias, cada uma teria seu próprio contador. A interface `RateLimiter` permite trocar por Redis sem alterar o serviço de autenticação.

## IP do cliente atrás do BFF (Next.js) — verificado em 2026-09-27

O rewrite `/auth/*` do Next 16 (tanto `next dev` quanto `next start`) **não adiciona** `X-Forwarded-For` e **repassa intacto** o valor enviado pelo cliente. Consequências:

- `TRUSTED_PROXY_COUNT=0` (padrão) não aceita IP forjado, mas todos os usuários aparecem com o IP do Next, e o limite por IP (30/min) passa a valer para todos juntos. **Confirmado em 2026-10-14:** 30 tentativas erradas esgotam o limite; da 31ª em diante, qualquer login recebe 429 por até 1 minuto, em qualquer conta (ADR-0016).
- `TRUSTED_PROXY_COUNT>0` só é seguro se a camada imediatamente à frente do Next **sobrescrever** o `X-Forwarded-For` com o IP real do cliente. Sem isso, o cliente forja o IP e contorna o limite. Isso foi reproduzido com `X-Forwarded-For: 203.0.113.99`, que foi aceito.
- **Requisito de deploy:** definir `TRUSTED_PROXY_COUNT` a partir da topologia real (edge/CDN → Next → AuthService) e validar com uma requisição que tenta forjar o `X-Forwarded-For`. O IP registrado em `auth.sessions.ip_address` não pode ser o forjado.

## Atualização 2026-10-14 (ADR-0016)

- Terceiro limite, **por conta** e independente do IP (padrão: 10 em 15 min). Trocar ou forjar o IP não reinicia a contagem.
- O valor do `X-Forwarded-For` é validado como IP; um valor inválido é descartado e vale o IP da conexão.
- Em produção, o boot avisa quando `TRUSTED_PROXY_COUNT=0`.

## Riscos

- Um atacante com muitos IPs distribui tentativas entre eles. Mitigado pelo limite por conta (ADR-0016). Ainda faltam alertas de volume.
- Com `TRUSTED_PROXY_COUNT=0` atrás do BFF, o limite por IP é compartilhado por todos os usuários (ver seção acima).
