# @base-sst/application

Camada de Aplicação (Application Business Rules) seguindo Clean Architecture.

## Estrutura

- `use-cases/`: Casos de uso orquestrando regras operacionais (ex: `GetArticleBySlug`, `AuthenticateUser`, `RegisterUser`).
- `dtos/`: Objetos de transferência de dados (Request / Response) desacoplando o domínio de protocolos HTTP.
- `validators/`: Validações de integridade de dados na borda da aplicação (Zod / Pydantic).
