# @base-sst/infrastructure

Camada de Infraestrutura e Adapters (Interface Adapters & Frameworks/Drivers) seguindo Clean Architecture.

## Estrutura

- `persistence/postgres/`: Repositórios relacionais (PostgreSQL, ORM, migrations).
- `persistence/filesystem/`: Repositórios baseados em sistema de arquivos (Markdown / Frontmatter SST).
- `security/`: Algoritmos criptográficos (Argon2, Bcrypt, RSA/Ed25519 JWT).
- `external/`: Adapters de serviços terceiros (Mailpit, SendGrid, clientes HTTP).
