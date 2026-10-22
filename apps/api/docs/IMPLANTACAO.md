# 🚢 Implantação em produção: checklist do AuthService

Requisitos que o código não resolve sozinho e dependem da hospedagem. Referências: ADR-0006 (limites e IP do cliente), ADR-0016 (auditoria de 2026-10-14) e `docs/AUDITORIA_AUTENTICACAO.md`. Como a autenticação e os limites de tentativas funcionam: [`docs/AUTENTICACAO.md`](../../docs/AUTENTICACAO.md).

O Render é a referência principal, mas cada item vale para qualquer hospedagem. O que é específico do Render está marcado.

> **Nota:** este checklist descreve uma implantação de produção. O deploy de teste no **plano gratuito** da Render não tem Private Service, Cron Job, Shell nem pre-deploy, e por isso não atende aos itens 2, 4 e 7: o AuthService fica público e `TRUSTED_PROXY_COUNT` fica em `0`. Diferenças, riscos e procedimentos do plano gratuito: [`docs/DEPLOY.md`](../../docs/DEPLOY.md).

---

## 1. Checklist

| # | Item | Como conferir |
| --- | --- | --- |
| 1 | `ENVIRONMENT=production` | O boot recusa configurações inseguras (cookies, origens, Argon2, SMTP sem TLS). |
| 2 | O AuthService não é acessível pela internet, só pelo Next | Uma requisição de fora para o endereço do AuthService precisa falhar. |
| 3 | A camada à frente do Next **substitui** o `X-Forwarded-For` (ou o número de saltos foi medido) | §2 e §3 |
| 4 | `TRUSTED_PROXY_COUNT` definido pela medição, nunca por suposição | `verify_client_ip` retorna `OK` **e** o IP gravado é o seu IP público real (§3). |
| 5 | `OPENAPI_ENABLED` sem valor (o padrão em produção é desligado) | `GET /openapi.json` retorna 404. |
| 6 | Nenhum `deployment_warning` no log de boot | Log do serviço logo após o deploy. |
| 7 | `purge-expired` agendado | §5 |

---

## 2. Por que o IP do cliente importa

O Next repassa o `X-Forwarded-For` que recebe, sem acrescentar nada (verificado no Next 16). O resultado depende do valor de `TRUSTED_PROXY_COUNT`:

- **0:** o AuthService vê o IP do Next em todas as requisições. O limite por IP vira um limite global: 30 tentativas erradas esgotam o limite; da 31ª em diante, qualquer login recebe 429 por até 1 minuto, em qualquer conta. O mesmo vale para cadastro, recuperação de senha e OAuth.
- **N > 0:** o AuthService usa o N-ésimo valor a partir da direita. Isso só é seguro se tudo à direita desse valor foi escrito por proxies confiáveis.
- **N maior que o número real de saltos:** o IP gravado é o de um proxy interno. Não é forjado, mas volta a ser um limite global. Por isso o item 4 exige comparar com o seu IP real.

O limite por conta (ADR-0016) protege cada conta mesmo com o IP errado. Ele não resolve o bloqueio global.

---

## 3. Verificação com cabeçalho forjado

O script faz um login real pela URL pública enviando `X-Forwarded-For: 203.0.113.77`. Depois lê no banco o IP gravado na sessão e encerra a sessão.

```bash
VERIFY_PASSWORD='senha da conta de teste' \
python -m backend.scripts.verify_client_ip --base-url https://kb.empresa.com --email teste@empresa.com
```

- Rode onde `DATABASE_URL` aponta para o banco de produção, por exemplo no shell do serviço do AuthService.
- A senha vem só de `VERIFY_PASSWORD`. Não aceite outra forma e não a grave em arquivo. Use uma conta de teste.
- Saída `0` e `OK: IP gravado X`: o IP forjado foi ignorado. Confira também se X é o seu IP público real.
- Saída `1` e `FALHA`: o IP gravado é o forjado, e o cliente controla o IP. Não publique assim.
- Saída `2`: erro de uso (senha ausente, login recusado, banco diferente).

Resultado em local (2026-10-14), com o Caddy à frente do Next e `TRUSTED_PROXY_COUNT=1`:

| Caminho | Resultado |
| --- | --- |
| Navegador → Caddy → Next → AuthService | `OK: IP gravado 172.17.0.1` (o IP que o Caddy viu); forjado ignorado |
| Acesso direto ao Next com cabeçalho forjado | `FALHA: o IP gravado é o forjado` |

O segundo caso mostra por que o Next e o AuthService não podem aceitar conexões que não passem pelo proxy de borda.

---

## 4. Proxy de borda

### Hospedagem própria (VPS)

Exemplos versionados em [`deploy/`](../../deploy), na raiz do repositório:

- `Caddyfile.example`: `header_up X-Forwarded-For {remote_host}`.
- `nginx.conf.example`: `proxy_set_header X-Forwarded-For $remote_addr`. Não use `$proxy_add_x_forwarded_for`, que acrescenta ao valor do cliente.

Com qualquer um dos dois, sem CDN à frente: `TRUSTED_PROXY_COUNT=1`. O Next e o AuthService escutam só em `127.0.0.1` ou na rede interna.

### Render (não verificado)

A documentação oficial do Render não descreve o tratamento do `X-Forwarded-For`. Relatos da comunidade dizem que:

- o proxy do Render **acrescenta** ao valor recebido e mantém o que o cliente forjou;
- a cadeia inclui saltos do Cloudflare e um salto interno (exemplo relatado: `forjado, cliente real, 172.71.x.x, 10.x.x.x`);
- o `True-Client-IP` é sobrescrito com o IP real.

Isso precisa ser medido no primeiro deploy.

Topologia recomendada:

- **Next** como Web Service público.
- **AuthService** como Private Service (sem URL pública), acessado pelo Next pela rede privada (`AUTH_INTERNAL_URL` da Base com o endereço interno). Assim nenhum salto extra é acrescentado entre o Next e o AuthService, e ninguém chega ao AuthService sem passar pelo Next.

O que medir no primeiro deploy:

1. Com `TRUSTED_PROXY_COUNT=0`, rode o script uma vez. Ele deve retornar `OK`, com um IP interno.
2. Aumente `TRUSTED_PROXY_COUNT` de 1 em 1 e rode o script a cada valor. O valor certo é o **menor** em que o IP gravado é o seu IP público real. Se algum valor fizer o script gravar `203.0.113.77`, o valor anterior era o máximo seguro.
3. Repita de outra rede (por exemplo, o celular sem Wi-Fi). O valor encontrado tem de dar o mesmo resultado.
4. Registre o valor e a data neste arquivo. Repita a medição se o Render mudar a borda ou se uma CDN for posta à frente.

Passo a passo executável, com critérios e reversão: §7.

### Opção a avaliar depois da medição: cabeçalho dedicado (não implementado)

Se o número de saltos no Render variar (por exemplo, entre regiões ou caminhos com e sem Cloudflare), contar saltos fica frágil. A alternativa seria uma configuração `CLIENT_IP_HEADER=True-Client-IP` que lê só esse cabeçalho. Ela só deve ser considerada se a medição mostrar que:

- o `True-Client-IP` chega ao AuthService (repassado pelo rewrite do Next) com o IP real, mesmo quando o cliente envia um `True-Client-IP` forjado;
- o valor é o mesmo em todas as redes testadas;
- o AuthService não tem acesso público, pois quem chegasse direto poderia definir o cabeçalho.

---

## 5. Limpeza periódica (`purge-expired`)

O comando remove sessões expiradas ou revogadas há mais de 30 dias, contadores de limite vencidos e links e estados temporários vencidos. Rode uma vez por dia.

| Ambiente | Como agendar |
| --- | --- |
| Render (plano pago) | Serviço do tipo **Cron Job** com a mesma imagem do AuthService. Agendamento `0 6 * * *` (UTC, 3h em Brasília). Comando `python -m backend.cli purge-expired`. Mesmas variáveis do AuthService (`DATABASE_URL`, `JWT_PRIVATE_KEY`, `ENVIRONMENT`). O Cron Job acessa o banco pela rede privada. |
| Docker Compose (VPS) | `docker compose --profile ops up -d purge` na pasta `AuthService/` ou na raiz (laço diário, fora do `up` padrão) |
| Linux com cron | `0 6 * * * cd /srv/authservice && .venv/bin/python -m backend.cli purge-expired >> /var/log/authservice-purge.log 2>&1` |

A execução imprime só contagens, sem dados pessoais.

---

## 6. OpenAPI

Sem `OPENAPI_ENABLED` definido, `/docs` e `/openapi.json` ficam ligados em desenvolvimento e desligados em produção. Ligar explicitamente em produção é possível, mas gera `deployment_warning` no boot. O contrato versionado continua em `docs/openapi.json`.

---

## 7. Roteiro do primeiro deploy: medição do proxy

Passo a passo para descobrir o `TRUSTED_PROXY_COUNT` certo. Os exemplos usam o Render, mas os passos valem para qualquer hospedagem; troque só os nomes dos painéis.

**Não verificado:** como o proxy do Render trata o `X-Forwarded-For` (§4). Os resultados esperados abaixo são hipóteses; o critério de aprovação é o que decide.

> **Nota:** o roteiro pressupõe o AuthService como Private Service. No plano gratuito ele é público; siga a adaptação de [`docs/DEPLOY.md`](../../docs/DEPLOY.md#9-ip-do-cliente-e-trusted_proxy_count), que mantém `TRUSTED_PROXY_COUNT=0`.

### 7.1 Pré-requisitos

| Item | Como conferir |
| --- | --- |
| Conta de **teste** ativa, sem troca de senha pendente, criada só para isto | Login manual pela Base funciona. |
| Base (Next) como Web Service público | URL pública abre a página inicial. |
| AuthService como Private Service, `AUTH_INTERNAL_URL` da Base com o endereço interno | Ver 7.3, passo 2. |
| Banco do AuthService com migrations aplicadas | Login manual funciona. |
| `ENVIRONMENT=production` e `OPENAPI_ENABLED` **sem valor** no AuthService | Painel de variáveis. |

Limites de login que a medição pode atingir: 5 por minuto para o mesmo IP e email, e 10 a cada 15 minutos por conta. Faça no máximo **uma execução por minuto** e, se aparecer `Login recusado (HTTP 429)`, espere 15 minutos.

### 7.2 Onde rodar o script

**Caso A: com Shell no serviço do AuthService** (planos do Render que oferecem Shell)

```bash
read -rs VERIFY_PASSWORD && export VERIFY_PASSWORD    # digite a senha; nada aparece nem fica no histórico
python -m backend.scripts.verify_client_ip --base-url https://SUA-BASE --email CONTA-DE-TESTE
curl -s https://api.ipify.org; echo                    # IP público de onde o script rodou
```

O `DATABASE_URL` já é o do serviço. O IP de referência é o IP de saída do próprio serviço, mostrado pelo `curl`, e não o da sua casa. Ele não permite testar uma segunda rede; para isso, use também o caso B.

**Caso B: sem Shell, de uma máquina local** (checkout do AuthService com `.venv` e um `.env` de desenvolvimento válido)

```bash
read -rs VERIFY_PASSWORD && export VERIFY_PASSWORD     # senha da conta de teste
read -rs DATABASE_URL && export DATABASE_URL           # URL EXTERNA do banco de produção
python -m backend.scripts.verify_client_ip --base-url https://SUA-BASE --email CONTA-DE-TESTE
curl -s https://api.ipify.org; echo                    # seu IP público
unset VERIFY_PASSWORD DATABASE_URL                     # ao terminar
```

- A URL externa fica no painel do banco. No Render, ela aparece como `postgresql://...`; troque o início por `postgresql+psycopg://` e mantenha `sslmode=require`.
- Variáveis de ambiente têm prioridade sobre o `.env`, então o script lê o banco de produção. As demais configurações vêm do `.env` local e não são usadas.
- O banco precisa aceitar conexões externas do seu IP. No Render isso fica no controle de acesso do banco (**não verificado** qual é o padrão). Libere só o seu IP e remova a liberação ao final.
- Nunca passe senha ou URL do banco como argumento, nem as grave em arquivo.

### 7.3 Passos

| # | Ação | Resultado esperado | Critério de aprovação |
| --- | --- | --- | --- |
| 1 | Deploy com `TRUSTED_PROXY_COUNT=0`. Abrir o log de boot do AuthService. | `authservice_started` e um `deployment_warning` sobre `TRUSTED_PROXY_COUNT=0` (esperado nesta fase). Nenhum aviso sobre `OPENAPI_ENABLED`. | Sem erro de boot; só o aviso esperado. |
| 2 | Conferir que o AuthService não é público: no painel, o tipo é Private Service e não há URL `onrender.com`. Do seu computador, `curl -sS https://NOME-DO-AUTHSERVICE.onrender.com/health`. | O `curl` falha (nome não resolve ou conexão recusada). | Nenhuma resposta do AuthService pela internet. Se responder, **pare**: corrija o tipo de serviço antes de seguir. |
| 3 | Conferir o OpenAPI desligado: no Shell (caso A), `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8000/openapi.json`. Sem Shell, o passo 1 já cobre (nenhum aviso de OpenAPI). | `404` | `404` ou ausência do aviso. |
| 4 | Rodar o script com N=0 (caso A ou B). | `OK: IP gravado X`, com X um IP interno ou do proxy, diferente do IP de referência. | Saída `0` e X diferente de `203.0.113.77`. |
| 5 | Mudar `TRUSTED_PROXY_COUNT` para N+1 e salvar (o Render refaz o deploy). Esperar o serviço ficar ativo e rodar o script. Repetir enquanto o IP gravado não for o IP de referência. | Em algum N, o IP gravado é o IP de referência. Hipótese pelos relatos: N=3. | Anote cada linha: N, saída e IP gravado. |
| 6 | Parar no **menor** N em que o IP gravado é o IP de referência. Rodar N+1 uma vez como prova negativa. | Com N+1, `FALHA: o IP gravado é o forjado`, ou outro IP. | Se N+1 gravar o forjado, N é o máximo seguro. Volte para N. |
| 7 | Repetir o script com o N escolhido a partir de **outra rede** (caso B; por exemplo, o celular como roteador). | IP gravado igual ao novo IP de referência. | Mesmo N funciona nas duas redes. Se não funcionar, não fixe N: volte para 0 e avalie a opção do cabeçalho dedicado (§4). |
| 8 | Reabrir o log de boot. | Nenhum `deployment_warning`. | Log limpo. |
| 9 | Conferir o Cron Job de limpeza (§5): disparar manualmente uma vez pelo painel. | Uma linha com as contagens (`Sessões removidas: ...`). | Execução com saída `0`. |
| 10 | Registrar abaixo o N, a data, as duas redes testadas e quem mediu. Remover a liberação de IP do banco (caso B). | n/a | Registro preenchido. |

Registro da medição:

| Data | Hospedagem | N | Redes testadas | Responsável |
| --- | --- | --- | --- | --- |
| (pendente) | - | - | - | - |

### 7.4 Reversão

| Situação | O que fazer |
| --- | --- |
| Algum N gravou o IP forjado | Voltar imediatamente para o N anterior ou para `0`. Com `0`, o IP não pode ser forjado; o custo é o limite global por IP (§2). |
| Resultado diferente entre redes | `TRUSTED_PROXY_COUNT=0` até reavaliar. Registrar os resultados. |
| Erro de boot ou serviço fora do ar depois de uma mudança | Rollback para o deploy anterior no painel da hospedagem (no Render: **Rollback** no histórico de deploys) e restaurar a variável anterior. |
| Sessões de teste | O script encerra a própria sessão. Se uma execução for interrompida, use "Sair de todos os dispositivos" com a conta de teste. |
