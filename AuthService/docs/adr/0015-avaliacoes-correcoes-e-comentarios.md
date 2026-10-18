# ADR-0015: Avaliações, sugestões de correção e comentários dos artigos

- Status: aceito
- Data: 2026-10-10

## Contexto

A Base de Conhecimento tinha avaliação por estrelas e "Sugerir evolução" gravadas só no `localStorage` de quem enviava: nada chegava aos responsáveis e a média não existia. Também foram pedidos comentários em todos os artigos, com autoria, edição, remoção e proteção contra spam.

Não existe ainda uma Knowledge API com banco próprio. O conteúdo dos artigos vive em Markdown no repositório da Base; o que precisa de persistência são só as **interações** das pessoas.

## Decisão

As interações ficam num módulo `content` do AuthService (rotas `/content/*`), no mesmo PostgreSQL e schema `auth`, referenciando o artigo pelo identificador público (slug da URL, `^[a-z0-9][a-z0-9-]{0,119}$`). A Base repassa `/content/*` ao AuthService, como já faz com `/auth/*`: mesma origem, cookie de sessão de sempre, CSRF por Origin e cabeçalhos de API (`no-store`, CSP).

Reaproveita o que já existe: contas e nomes de exibição, papéis vindos do banco, limitador de tentativas em PostgreSQL e o tratamento de erros.

| Interação | Regras |
| --- | --- |
| Avaliação (`article_ratings`) | Nota inteira de 1 a 5, **uma por pessoa por artigo** (votar de novo troca a nota; dá para remover). Média, total e distribuição são públicos. Exige sessão. |
| Sugestão de correção (`article_corrections`) | Tipo (erro, desatualizado, inconsistência, outro), descrição (10–2000) e trecho afetado opcional (até 1000). Fica `open` até um editor ou admin marcar `resolved` ou `rejected`, com observação opcional. A mesma sugestão aberta não é aceita duas vezes. Quem enviou vê o andamento em "Minha conta". |
| Comentário (`article_comments`) | Leitura pública; publicar exige sessão. Texto puro (2–2000), no máximo 2 links, sem caracteres de controle. Respostas com um nível. Quem escreveu edita (marca `edited_at`) e remove; editores e admins removem qualquer um (moderação). Remoção é lógica: um comentário removido com respostas vira um marcador "removido" para não quebrar a conversa. O mesmo texto da mesma pessoa no mesmo artigo em 24 h é recusado (`409`). |

Limites por pessoa: 5 comentários/10 min, 20 edições/10 min, 5 sugestões/hora, 30 avaliações/10 min (`429` com `Retry-After`).

## Trade-offs

- **Acoplamento:** interações de conteúdo num serviço de identidade. Aceito porque as tabelas só dependem de `users` e o módulo é isolado (modelo, serviço e rotas próprios); quando houver uma Knowledge API, as três tabelas e as rotas mudam de casa e ela valida o JWT pelo JWKS, como já previsto no ADR-0002.
- **Artigo não verificado no servidor:** o AuthService não conhece o catálogo; ele valida só o formato do identificador. Um identificador inexistente gera, no máximo, interações órfãs que nunca aparecem na Base.
- **Sem confirmação de email para comentar:** reduz atrito; o limite de envio, a regra de links e a moderação seguram o spam. Exigir email confirmado é uma mudança de uma linha se o volume de spam justificar.
- **Moderação reativa:** comentários aparecem na hora e a moderação remove depois (fila "Comentários recentes" no painel). Pré-aprovação pode ser adicionada com um campo de status se necessário.
