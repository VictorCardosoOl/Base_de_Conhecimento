# ADR-0001: AuthService como provedor de identidade, com schema próprio no PostgreSQL

- Status: aceito
- Data: 2026-09-27

## Contexto

O AuthService guardava usuários em um `dict` em memória (perdidos a cada restart), com ids inteiros e sem papel. A Base de Conhecimento precisa de identidade persistente e de papéis para autorização.

## Decisão

- O AuthService é o dono da identidade: usuários, sessões e refresh tokens.
- Persistência em PostgreSQL, no schema `auth`. Pode compartilhar o cluster com outros serviços, mas nenhum outro serviço lê ou escreve essas tabelas.
- Ids são UUID (o `sub` do JWT). Email é normalizado (trim + minúsculas) e único, com uma constraint no banco que garante a normalização.
- Papéis iniciais: `admin` e `user`, em coluna com `CHECK` (não enum nativo, para facilitar migrations).
- Esquema versionado com Alembic. Tabelas **nunca** são criadas no boot; `alembic upgrade head` é uma etapa de release.
- Não existe cadastro público. Usuários são criados por `POST /admin/users` (papel `admin`) ou pela CLI `python -m backend.cli create-user`.

## Alternativas consideradas

- **SQLite:** diverge do PostgreSQL de produção (concorrência, `FOR UPDATE`, tipos).
- **Tabela de papéis:** só se justifica com papéis dinâmicos ou vários papéis por usuário.

## Consequências

- Outros serviços referenciam usuários apenas pelo UUID vindo do token.
- O primeiro admin de produção é criado pela CLI, que pede a senha de forma interativa.
