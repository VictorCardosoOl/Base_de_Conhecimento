# 📖 Glossário

Termos de Saúde e Segurança do Trabalho usados nos artigos e termos técnicos usados na documentação e no
código dos dois serviços.

---

## Domínio (conteúdo da Base)

| Termo | Significado |
| --- | --- |
| SST | Saúde e Segurança do Trabalho |
| eSocial | Sistema do governo federal para envio de informações trabalhistas, previdenciárias e de SST |
| e-CAC | Centro Virtual de Atendimento da Receita Federal, usado para procurações eletrônicas |
| NR | Norma Regulamentadora do Ministério do Trabalho |
| GRO | Gerenciamento de Riscos Ocupacionais |
| PGR | Programa de Gerenciamento de Riscos |
| PCMSO | Programa de Controle Médico de Saúde Ocupacional |
| LTCAT | Laudo Técnico das Condições Ambientais do Trabalho |
| PPP | Perfil Profissiográfico Previdenciário |
| CAT | Comunicação de Acidente de Trabalho |
| ASO | Atestado de Saúde Ocupacional |
| CNAB | Padrão de arquivo de troca de dados com bancos (remessa e retorno de cobrança) |

---

## Técnico

| Termo | Significado |
| --- | --- |
| BaseCore | O site da Base de Conhecimento (Next.js), pasta `BaseCore/` |
| AuthService | O serviço de identidade e de interações (FastAPI), pasta `AuthService/` |
| Access token | Credencial curta (10 min) em JWT, no cookie `kb_at`; prova quem é a pessoa a cada requisição |
| Refresh token | Credencial longa (7 dias), opaca, no cookie `kb_rt`; serve só para obter um novo access token |
| Refresh rotativo | Cada renovação troca o refresh token por um novo; reusar o antigo revoga a sessão |
| JWT | JSON Web Token: dados assinados que o servidor confere sem consultar o banco |
| JWKS | Endereço com as chaves públicas para conferir a assinatura dos JWT (`/.well-known/jwks.json`) |
| EdDSA | Algoritmo de assinatura (Ed25519) usado nos JWT |
| Argon2id | Algoritmo de hash de senha usado pelo AuthService |
| PKCE | Proof Key for Code Exchange: prova de que quem troca o código do login social é quem iniciou o fluxo |
| OAuth | Protocolo do login social (Google, GitHub) |
| CSRF | Ataque que usa a sessão de outra pessoa a partir de outro site; bloqueado pela checagem de `Origin` |
| `HttpOnly` | Atributo de cookie que o impede de ser lido por JavaScript |
| `SameSite=Lax` | Atributo de cookie que não o envia em requisições de outros sites, exceto navegação comum |
| Rewrite | Repasse feito pelo Next de `/auth/*` e `/content/*` para o AuthService, na mesma origem |
| Proxy de borda | Servidor à frente do site (Caddy, Nginx, CDN) que recebe as conexões da internet |
| `X-Forwarded-For` | Cabeçalho com o IP do cliente, preenchido pelos proxies |
| Rate limit | Limite de tentativas por intervalo de tempo (`429` ao exceder) |
| ADR | Architecture Decision Record: registro curto de uma decisão de arquitetura, com contexto e consequências |
| E2E | Teste de ponta a ponta, num navegador real contra os serviços no ar |
| Snapshot visual | Imagem de referência que o teste compara com a tela atual |
| Monorepo | Um repositório com mais de um serviço, cada um na sua pasta |
