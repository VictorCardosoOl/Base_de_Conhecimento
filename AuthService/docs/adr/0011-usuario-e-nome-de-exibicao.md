# ADR-0011: Usuário (username) e nome de exibição

- Status: aceito
- Data: 2026-10-01
- Altera: ADR-0010 (o cadastro passa a exigir usuário e nome)

## Contexto

O responsável pelo produto pediu dois campos novos em toda conta: um **Usuário**, identificador único usado em buscas e referências, e um **Nome** de exibição, livre. O cadastro (público ou pelo admin) passa a pedir os dois depois de email e senha. A tela de gestão troca o formulário fixo por uma busca (usuário, nome e email) e um botão que abre o cadastro em um modal.

## Decisão

**Usuário (`username`)**

- Formato: 3 a 30 caracteres, `a-z`, `0-9`, `.`, `-` e `_`, começando com letra ou número (`^[a-z0-9][a-z0-9._-]{2,29}$`). Sem acentos nem espaços, para servir de referência estável (ex.: em URLs e menções).
- Forma canônica em minúsculas: a API normaliza (trim + minúsculas) antes de validar, e o banco **rejeita** qualquer valor fora do formato (`ck_users_username_format`). Assim `Maria.Silva` e `maria.silva` são o mesmo usuário.
- Unicidade garantida no banco (`uq_users_username`). A verificação prévia no serviço só dá uma mensagem melhor; numa corrida, a restrição decide e a resposta continua 409.
- Conflitos respondem `409 CONFLICT` com `details: [{field, message}]`, onde `field` é `email` ou `username`, para o formulário marcar o campo certo.

**Nome (`display_name`)**

- Livre, 1 a 100 caracteres depois do trim, sem unicidade. O banco rejeita nome em branco (`ck_users_display_name_not_blank`). Quem exibe o nome é responsável por escapá-lo (o React já faz isso).

**Disponibilidade em tempo real (`GET /auth/username-available?username=`)**

- Responde `{username, available, reason}`, com `reason` = `invalid` ou `taken`. Público (o cadastro acontece antes do login) e limitado por IP (`USERNAME_CHECK_RATE_LIMIT_*`, padrão 60/min).
- É só uma prévia: o cadastro confere de novo e o banco garante.

**Busca na gestão (`GET /admin/users?q=`)**

- "Contém", sem diferenciar maiúsculas, em usuário, nome e email. Os curingas do `LIKE` (`%`, `_`, `\`) são tratados como texto. Só admin.

**Contas que já existiam**

- A migration `d4f2b9a7c303` preenche usuário e nome a partir da parte do email antes do `@` (usuário saneado; repetidos ganham um sufixo do id) e só então torna as colunas obrigatórias.
- Os usuários de teste (`seed-dev-users`) passam a nascer como `admin`, `editor` e `leitor` (nomes "Administrador", "Editor" e "Leitor"); `SEED_<PAPEL>_USERNAME` e `SEED_<PAPEL>_NAME` trocam.

## Trade-offs

- **Enumeração de usuários:** a consulta de disponibilidade revela se um usuário existe. Usuários não são segredo (servem justamente de referência pública) e não dão acesso a nada sem a senha, que é ligada ao email; o limite por IP reduz varredura em massa.
- **Formato restrito:** nomes com acento ou espaço vão no campo Nome, não no Usuário. É o preço de um identificador estável e sem ambiguidade (ex.: `joão` vs `joao`).
- **Sem troca de usuário pelo próprio usuário (ainda):** não há rota para editar usuário/nome depois do cadastro. Fica para quando houver uma página de perfil.
