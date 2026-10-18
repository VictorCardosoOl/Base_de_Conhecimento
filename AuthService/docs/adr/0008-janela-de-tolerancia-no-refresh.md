# ADR-0008: Janela de tolerância para refresh concorrente

- Status: aceito
- Data: 2026-09-27
- Altera: ADR-0004 (detecção de reuso)

## Contexto

Com rotação estrita (ADR-0004), qualquer reapresentação de um refresh token já rotacionado revogava a sessão inteira. Na validação do contrato com a Base de Conhecimento, o cenário de **duas abas** renovando a sessão ao mesmo tempo, com o mesmo cookie, resultou em `[200, 401]`: a segunda aba era tratada como atacante e o usuário legítimo era deslogado.

Isso acontece no uso normal: várias abas abertas, o access token expira, e todas chamam `/auth/refresh` quase ao mesmo tempo. Coordenar isso no navegador (Web Locks) tornaria a correção do login dependente do frontend.

## Decisão

- A rotação continua a cada uso.
- Se o refresh token **imediatamente anterior** for reapresentado **até `REFRESH_REUSE_GRACE_SECONDS` segundos** (padrão **10**, entre 0 e 60) depois da rotação, a chamada é tratada como concorrência legítima: recebe um **novo par de tokens** e a sessão continua ativa.
- "Imediatamente anterior" significa que o sucessor dele ainda não foi usado. Se o cliente já avançou outra rotação, a reapresentação é reuso, mesmo dentro da janela.
- A janela conta a partir da **primeira** rotação do token: o caminho concorrente não atualiza `used_at` nem o sucessor original, então a tolerância não se estende indefinidamente.
- Fora da janela, o reuso continua caracterizando possível comprometimento e **revoga a família inteira** (`revoked_reason = refresh_token_reuse`).
- `REFRESH_REUSE_GRACE_SECONDS=0` desliga a tolerância e volta ao comportamento estrito.

## Trade-off de segurança

- **O que se perde:** um token roubado e usado **dentro de 10 s** da rotação legítima, antes de o cliente legítimo rotacionar de novo, não é detectado como reuso. O atacante passa a ter um ramo próprio da sessão, que continua limitado pela validade absoluta da sessão, pelo logout e pelo logout-all.
- **O que se mantém:** o reuso depois da janela, ou de um token com mais de uma geração de atraso, continua revogando tudo. O refresh token só trafega em cookie `HttpOnly; Secure; SameSite=Lax; Path=/auth`, o que reduz muito a chance de roubo.
- **Referência de mercado:** Auth0 ("reuse interval") e Okta ("grace period") oferecem a mesma tolerância, também em segundos.

## Consequências

- Várias abas podem renovar ao mesmo tempo sem derrubar a sessão. A Base de Conhecimento ainda faz uma única chamada de refresh por vez dentro da aba, como boa prática, mas não depende disso.
- Refreshes concorrentes dentro da janela geram mais de um token válido na mesma sessão (um por aba). Todos pertencem à mesma família e são revogados juntos.
