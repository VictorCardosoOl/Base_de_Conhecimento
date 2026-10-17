# ADR-0002: Access token JWT EdDSA (Ed25519) com PyJWT e JWKS

- Status: aceito
- Data: 2026-09-27

## Contexto

O token era HS256 com `SECRET_KEY` compartilhada: qualquer serviço capaz de validar tokens também conseguiria emiti-los. A biblioteca `python-jose` tem manutenção fraca e CVEs publicadas em 2024. O `.env.example` continha uma chave com aparência de real, que deve ser tratada como comprometida.

## Decisão

- Algoritmo **EdDSA/Ed25519**, via **PyJWT 2.15** + `cryptography`. A validação aceita apenas `EdDSA`, o que rejeita `none` e HS256 forjado.
- A chave privada existe só no AuthService (`JWT_PRIVATE_KEY` ou `JWT_PRIVATE_KEY_FILE`). A Knowledge API recebe apenas chaves públicas, via `GET /.well-known/jwks.json`.
- `kid` = thumbprint RFC 7638 da chave pública (determinístico, sem cadastro manual).
- Claims: `sub` (UUID), `iss`, `aud`, `iat`, `exp`, `jti`, `role` e `sid` (id da sessão). Todas são obrigatórias na validação. Sem email nem dados pessoais.
- TTL do access token configurável (`ACCESS_TOKEN_TTL_SECONDS`, padrão 600 s, máximo 3600 s).

## Rotação de chaves (sem downtime)

1. Gerar a nova chave: `python -m backend.scripts.generate_keys --out keys-novas`.
2. Publicar a chave pública **antiga** em `JWT_ADDITIONAL_PUBLIC_KEYS(_FILE)` e trocar `JWT_PRIVATE_KEY_FILE` pela nova.
3. Após o maior TTL de access token somado ao cache do JWKS (5 min), remover a chave antiga.

## Riscos

- Consumidores precisam suportar Ed25519. No Node, a biblioteca `jose` suporta EdDSA e JWKS; validar isso na integração da Knowledge API.
- Tokens são stateless para os consumidores: uma sessão revogada continua aceita pela Knowledge API até o `exp` (no máximo o TTL). O AuthService (`/auth/me`) confere a sessão no banco.
