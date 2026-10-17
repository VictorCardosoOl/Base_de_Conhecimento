# 🩺 Solução de problemas

Problemas comuns ao usar e rodar a Base SST. Detalhes de autenticação em
[AUTENTICACAO.md](./AUTENTICACAO.md); de testes em [TESTES.md](./TESTES.md).

---

## Uso

### Limpei os dados do navegador e continuo logado

É esperado se a limpeza não apagou os cookies do site. Os tokens ficam em cookies `HttpOnly`, não no
armazenamento local. Se só o access token (`kb_at`) foi apagado, a tela de login renova a sessão com o
refresh token (`kb_rt`, que fica no caminho `/auth`) e volta para a página. Para sair de verdade, use
**Sair**; para encerrar em todos os aparelhos, **Minha conta > Sair de todos os dispositivos**.

### "Muitas tentativas. Tente novamente em …" ao entrar

O login tem limites por IP, por IP + email e por conta, e só tentativas erradas contam. Espere o tempo
mostrado; durante o bloqueio, nem a senha correta entra. Se esqueceu a senha, use "Esqueceu a senha?":
a recuperação não depende desse bloqueio. Regras em
[AUTENTICACAO.md](./AUTENTICACAO.md#limites-de-tentativas).

Se **todo mundo** recebe `429` ao mesmo tempo num ambiente publicado, o AuthService provavelmente está
vendo só o IP do proxy (F1). Confira `TRUSTED_PROXY_COUNT` e o proxy de borda em
[`AuthService/docs/IMPLANTACAO.md`](../AuthService/docs/IMPLANTACAO.md).

### "Troque a senha temporária em Minha conta antes de continuar"

A conta foi criada ou teve a senha redefinida por um administrador. A API responde
`403 PASSWORD_CHANGE_REQUIRED` a qualquer escrita até a troca. Vá em **Minha conta > Trocar senha**.

### O login volta para ele mesmo, ou mostra "Não foi possível manter a sessão neste navegador"

O AuthService gravou a sessão, mas o servidor da BaseCore não a enxerga. Causas comuns:

- `AUTH_ACCESS_COOKIE_NAME` da BaseCore diferente de `ACCESS_COOKIE_NAME` do AuthService;
- cookies `Secure` (`__Host-kb_at`) servidos por HTTP, sem HTTPS;
- `AUTH_ISSUER` ou `AUTH_AUDIENCE` diferentes de `JWT_ISSUER` e `JWT_AUDIENCE`.

O console do navegador mostra "[auth] Sessão renovada, mas o destino voltou ao login" quando o detector
de loop interrompe as voltas.

---

## Ambiente local

### Docker parado depois de reiniciar o computador

Abra o Docker Desktop e espere o status "running". Depois suba de novo: `docker compose up -d` na raiz,
ou `npm run auth:up` na pasta `BaseCore/`. Os dados do banco ficam no volume e não se perdem com
`stop` ou `down` (só com `down -v`).

### Porta ocupada (3000, 8010 ou 8025)

Outro processo usa a porta: por exemplo um `npm run dev` antigo, ou o AuthService subido pelo compose
da pasta `AuthService/` junto com o da raiz. Pare o processo antigo ou troque a porta:
`AUTH_PORT` (AuthService), `MAILPIT_UI_PORT` (Mailpit), `BASECORE_PORT` (BaseCore no compose da raiz) ou
`npm run dev -- -p 3001`. Se mudar a porta da BaseCore, inclua a nova origem em `TRUSTED_ORIGINS` do
AuthService.

### O Docker diz que a porta é "proibida" ou "not available" (Windows)

O Windows reserva faixas de portas para o Hyper-V e o WSL, e essas faixas mudam a cada reinício. Uma porta
que funcionava pode cair numa faixa reservada. Veja as faixas com
`netsh interface ipv4 show excludedportrange protocol=tcp` e escolha uma porta fora delas (o banco de teste
do guia usa a 15432 por isso).

### Login e cadastro recusados com `403` "Origem não permitida"

A origem da BaseCore não está em `TRUSTED_ORIGINS` do `AuthService/.env`. Em desenvolvimento, inclua
`http://localhost:3000`.

### O site abre, mas login, conta e painel dizem "indisponível"

O AuthService não está no ar ou `AUTH_INTERNAL_URL` da BaseCore aponta para o endereço errado. Teste
`http://localhost:8010/health`.

Se o log do servidor da BaseCore mostra `[auth] Configuração de autenticação inválida: ...`, falta alguma
variável: `AUTH_INTERNAL_URL`, `AUTH_ISSUER`, `AUTH_AUDIENCE` e `AUTH_ACCESS_COOKIE_NAME` andam juntas.
Enquanto isso, as rotas protegidas ficam indisponíveis e não concedem acesso. Se o próprio login some
(`/auth/login` responde 404), o build foi feito sem `AUTH_INTERNAL_URL`: defina a variável e construa de novo.

### O pytest para com "Defina TEST_DATABASE_URL"

Os testes do AuthService precisam de um PostgreSQL de teste. Veja [TESTES.md](./TESTES.md#authservice).

### O build ou o `npm run dev` alteram `src/data/catalog.json` e `src/data/mapping.ts`

São gerados a partir dos artigos (`npm run catalog`, que roda antes do build e do dev). Se só mudou o
fim de linha, nada mudou de verdade; se mudou o conteúdo, algum artigo foi alterado e os dois arquivos
devem ir junto no commit.
