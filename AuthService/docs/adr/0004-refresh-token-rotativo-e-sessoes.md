# ADR-0004: Sessões com refresh token opaco, rotativo e com detecção de reuso

- Status: aceito (detecção de reuso ajustada pelo ADR-0008)
- Data: 2026-09-27

## Decisão

- Cada login cria uma **sessão** (tabela `sessions`), com validade absoluta (`SESSION_MAX_LIFETIME_SECONDS`), IP e user agent.
- O refresh token é aleatório (256 bits), **opaco** (não é JWT) e só o SHA-256 é gravado. Um hash sem sal basta porque o token tem alta entropia.
- Cada `POST /auth/refresh` emite um novo refresh token, marca o anterior como usado (`used_at`, `replaced_by_id`) e emite um novo access token. As linhas ficam travadas com `SELECT ... FOR UPDATE`.
- **Reuso:** apresentar um refresh token já rotacionado revoga a sessão inteira (`revoked_reason = refresh_token_reuse`) e gera log de alerta. O token legítimo mais novo também deixa de funcionar.
- Logout revoga a sessão e é idempotente. `POST /auth/logout-all` revoga todas as sessões do usuário. Um usuário desativado tem a sessão revogada no próximo refresh e é recusado em `/auth/me`.

## Consequências

- Refreshes concorrentes (várias abas) dentro de uma janela curta são tratados como legítimos, e não como reuso. Ver ADR-0008.
- A limpeza de sessões expiradas é feita por `python -m backend.cli purge-expired`, que deve ser agendado.
