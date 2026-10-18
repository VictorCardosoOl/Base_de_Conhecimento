# 🧭 Decisões de arquitetura (ADRs)

Cada ADR registra uma decisão: contexto, o que foi decidido e as consequências. Os ADRs 0001 a 0016 foram
escritos quando o AuthService era um repositório separado e continuam em `AuthService/docs/adr/`. Os novos,
que valem para o projeto inteiro, seguem a numeração nesta pasta.

Para criar um ADR: copie o formato de um existente (título `ADR-NNNN: assunto`, status, data, relação com
ADRs anteriores quando houver, contexto, decisão, alternativas consideradas e consequências ou trade-offs), use o próximo número e acrescente-o a esta tabela.

| ADR | Decisão | Status |
| --- | --- | --- |
| [0001](../../AuthService/docs/adr/0001-authservice-como-provedor-de-identidade.md) | AuthService como provedor de identidade, com schema próprio no PostgreSQL | aceito (alterado pelo 0010) |
| [0002](../../AuthService/docs/adr/0002-jwt-eddsa-e-jwks.md) | Access token JWT EdDSA (Ed25519) com PyJWT e JWKS | aceito |
| [0003](../../AuthService/docs/adr/0003-argon2id-para-senhas.md) | Argon2id para hash de senhas | aceito |
| [0004](../../AuthService/docs/adr/0004-refresh-token-rotativo-e-sessoes.md) | Sessões com refresh token opaco, rotativo e com detecção de reuso | aceito (ajustado pelo 0008) |
| [0005](../../AuthService/docs/adr/0005-cookies-csrf-e-cors.md) | Cookies HttpOnly, defesa CSRF por Origin e CORS desligado | aceito |
| [0006](../../AuthService/docs/adr/0006-rate-limiting.md) | Limites de tentativas de login em PostgreSQL, com interface substituível | aceito (atualizado pelo 0016) |
| [0007](../../AuthService/docs/adr/0007-frontend-de-demonstracao.md) | Adaptação do frontend de demonstração ao fluxo por cookies | aceito |
| [0008](../../AuthService/docs/adr/0008-janela-de-tolerancia-no-refresh.md) | Janela de tolerância para refresh concorrente | aceito |
| [0009](../../AuthService/docs/adr/0009-gestao-de-usuarios-e-papel-editor.md) | Gestão de usuários pelo admin e papel editor | aceito (alterado pelos 0010 e 0016) |
| [0010](../../AuthService/docs/adr/0010-cadastro-publico-e-pedidos-de-editor.md) | Cadastro público, pedidos de acesso de editor e usuários de teste | aceito (alterado pelos 0011 e 0012) |
| [0011](../../AuthService/docs/adr/0011-usuario-e-nome-de-exibicao.md) | Usuário (username) e nome de exibição | aceito (alterado pelo 0012) |
| [0012](../../AuthService/docs/adr/0012-recuperacao-de-senha-e-confirmacao-de-email.md) | Recuperação de senha, confirmação de email e nomes reservados | aceito |
| [0013](../../AuthService/docs/adr/0013-login-social-oauth.md) | Login social (OAuth 2.0 com PKCE) | aceito |
| [0014](../../AuthService/docs/adr/0014-termos-de-uso-e-perfil-opcional.md) | Aceite dos termos e perfil complementar opcional | aceito |
| [0015](../../AuthService/docs/adr/0015-avaliacoes-correcoes-e-comentarios.md) | Avaliações, sugestões de correção e comentários dos artigos | aceito |
| [0016](../../AuthService/docs/adr/0016-auditoria-de-autenticacao.md) | Correções da auditoria de autenticação: limite por conta, IP validado, troca de senha no servidor e só falhas contam | aceito |
| [0017](./0017-monorepo.md) | Monorepo: BaseCore e AuthService no mesmo repositório, como serviços separados | aceito |
| [0018](./0018-render.md) | Hospedagem na Render, um serviço por pasta, no plano gratuito | proposto |
