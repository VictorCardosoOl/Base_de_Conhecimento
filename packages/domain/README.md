# @base-sst/domain

Camada de Domínio (Enterprise Business Rules) seguindo Clean Architecture.

## Estrutura

- `entities/`: Entidades centrais do negócio com validações intrínsecas (ex: `Article`, `User`, `Category`, `Session`).
- `value-objects/`: Tipos imutáveis autocontidos (ex: `Email`, `Cpf`, `Slug`, `Role`).
- `contracts/`: Interfaces e portas de abstração (ex: `IArticleRepository`, `IUserRepository`, `IAuthGateway`).

Esta camada não deve depender de frameworks web, drivers de banco de dados ou bibliotecas externas de transporte.
