# ADR-0003: Argon2id para hash de senhas

- Status: aceito
- Data: 2026-09-27

## Contexto

O serviço usava `bcrypt==4.0.1` fixado. Não havia hashes persistidos (os usuários viviam em memória), então trocar o algoritmo não exige migração de dados.

## Decisão

- **Argon2id** via `argon2-cffi 25.1`, com parâmetros por configuração. O padrão é o perfil da RFC 9106 (t=3, m=64 MiB, p=4). Em produção, o boot recusa valores abaixo do mínimo do OWASP (m=19 MiB, t=2).
- Rehash transparente no login quando os parâmetros mudam (`check_needs_rehash`).
- Política: 12 a 256 caracteres, sem regras de composição (orientação NIST SP 800-63B).
- Usuário inexistente executa uma verificação completa contra um hash fictício, para que o tempo de resposta não revele a existência do email.

## Alternativas consideradas

- **bcrypt:** trunca senhas acima de 72 bytes e tem resistência menor a ataques com GPU.
- **scrypt:** adequado, mas o Argon2id é a recomendação primária do OWASP.
