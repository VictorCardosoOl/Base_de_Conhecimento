# ADR-0005: Cookies HttpOnly, defesa CSRF por Origin e CORS desligado

- Status: aceito
- Data: 2026-09-27

## Decisão

- Tokens **nunca** no corpo das respostas nem acessíveis ao JavaScript.
  - Access: cookie `__Host-kb_at`, com `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` e sem `Domain`.
  - Refresh: cookie `__Secure-kb_rt`, com `HttpOnly`, `Secure`, `SameSite=Lax` e `Path=/auth`, então só trafega nas rotas de autenticação.
  - Os nomes são configuráveis. Em HTTP local os prefixos não funcionam, e o boot valida essas combinações.
- Clientes não-navegador podem usar `Authorization: Bearer` (o Bearer tem precedência sobre o cookie).
- **CSRF**, com duas camadas:
  1. `SameSite=Lax`;
  2. middleware que, em POST/PUT/PATCH/DELETE, exige que `Origin` (ou, na falta dele, `Referer`) esteja em `TRUSTED_ORIGINS`, e recusa requisições com cookie de autenticação sem origem nenhuma.

  `HttpOnly` não protege contra CSRF; por isso existe esta camada.
- **CORS** fica desligado por padrão: com o BFF/rewrite do Next, o navegador fala com uma única origem. Se habilitado, só com lista explícita (`*` é recusado no boot) e `allow_credentials`.
- Headers: `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, CSP `default-src 'none'` e `Cache-Control: no-store` nas rotas da API; HSTS em produção.
