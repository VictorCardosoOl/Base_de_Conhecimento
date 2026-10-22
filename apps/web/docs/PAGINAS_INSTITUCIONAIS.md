# ⚖️ Páginas institucionais (Termos, Privacidade, Cookies)

Rotas: `/termos`, `/privacidade` e `/cookies`, nesta ordem fixa (`LEGAL_PAGES` em `src/features/legal/institutional.ts`). O item "LGPD e privacidade" do menu abre `/termos`, a entrada dos documentos. Cada página termina com a navegação contextual (`LegalPager`), em coluna centralizada: Página anterior, HOME (em destaque) e Próxima página; nas pontas da sequência, a opção sem destino não aparece.

> **Situação jurídica:** os textos foram revisados para corresponder ao funcionamento do código e citam a legislação oficial, mas **não passaram por revisão jurídica profissional**. Não os trate como validados antes dessa revisão.

---

## Onde fica cada coisa

| Item | Arquivo |
| --- | --- |
| Textos dos Termos e da Política (versão e data de revisão) | `src/features/legal/documents.ts` |
| Contato, controladora, encarregado e fontes oficiais | `src/features/legal/institutional.ts` |
| Inventário de cookies e dados no navegador | `src/features/consent/storage-inventory.ts` |
| Controles de preferência | `src/features/consent/components/CookiePreferences.tsx` |
| Layout comum e navegação contextual | `src/features/legal/components/LegalPageLayout.tsx`, `LegalPager.tsx` |

**Versão dos documentos:** `TERMS_VERSION` e `PRIVACY_VERSION` (Base) precisam ser iguais a `TERMS_VERSION` e `PRIVACY_POLICY_VERSION` do AuthService; o cadastro só aceita a versão vigente. Nesta revisão, ambas passaram para `2026-10-10` nos dois serviços.

---

## Origem das afirmações

| Afirmação | Verificado em |
| --- | --- |
| Senhas com Argon2id | AuthService `backend/core/passwords.py` |
| Sessões guardam IP, navegador e datas | `backend/models/session.py` |
| Contadores de tentativas guardados como hash | `backend/core/rate_limit.py` (`rate_limit_key`, SHA-256) |
| Aceite guarda data, versões, forma e IP | `backend/models/terms_acceptance.py`, `CONSENT_RECORD_IP` |
| Exclusão da conta apaga sessões, aceites, avaliações e comentários; sugestões ficam sem autor | chaves estrangeiras `ON DELETE CASCADE` / `SET NULL` |
| Comentários removidos são mantidos (exclusão lógica) | `backend/models/content.py` (`deleted_at`) |
| Limpeza de sessões vencidas e encerradas há mais de 30 dias | `backend/cli.py purge-expired` |
| Links por e-mail: 30 min (senha) e 24 h (confirmação) | `PASSWORD_RESET_TOKEN_TTL_SECONDS`, `EMAIL_VERIFICATION_TOKEN_TTL_SECONDS` (padrões) |
| Cookies `__Host-kb_at`, `__Secure-kb_rt`, OAuth e prazos | `backend/core/config.py`, `backend/api/cookies.py` (padrões) |
| E-mails enviados: redefinição, senha alterada, confirmação, login social vinculado | `backend/core/email_templates.py` |
| Monitoramento (Sentry) só com consentimento e DSN; textos mascarados no Replay | `src/features/analytics/telemetry.ts` |
| Chave `sentryReplaySession` | `@sentry/replay` (`REPLAY_SESSION_KEY`) |
| Chaves do armazenamento local | conferidas por teste (`src/tests/legal/institutionalPages.test.tsx`) |

---

## Fontes oficiais consultadas (10/10/2026)

- [Lei nº 13.709/2018 (LGPD), texto compilado — Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm): arts. 7º (bases legais), 8º, § 5º (revogação), 9º (informações ao titular), 16 (eliminação), 18 (direitos; § 1º, petição à ANPD), 41 (encarregado), 46 (segurança) e 48 (incidentes).
- [Guia orientativo “Cookies e proteção de dados pessoais” — ANPD](https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia_orientativo_cookies_e_protecao_de_dados_pessoais): categorias (necessários e não necessários), banner com opção de rejeitar.
- Resolução CD/ANPD nº 18/2024 (atuação do encarregado) e Resolução CD/ANPD nº 2/2022 (agentes de pequeno porte), citadas apenas como referência para a pendência do encarregado.

---

## Mudanças de funcionamento feitas junto

- **Modal "LGPD e privacidade" removido.** Ele trazia um segundo texto jurídico contraditório ("ao navegar, você concorda", "compromisso absoluto", cláusula de isenção por incidentes, "SLA"). As páginas são agora a única fonte; menu, rodapé e aviso de cookies levam a elas.
- **Revogação aplicada na hora:** recusar o monitoramento encerra o Sentry já carregado e apaga `sentryReplaySession` (`stopTelemetry`).
- **Registro local de buscas removido:** gravado com consentimento, mas sem nenhum uso desde a refatoração do painel. A chave antiga é apagada ao carregar o site.
- **Aviso de cookies reescrito** sem "telemetria anônima" nem selo "Protegido"; botões "Permitir monitoramento" e "Recusar".
- **"Apagar dados locais"** na página de cookies remove os dados de recursos deste aparelho.

---

## Pendências antes da publicação definitiva

1. **Revisão jurídica** dos três textos, em especial: enquadramento das bases legais (art. 7º), autorização de uso de comentários e sugestões (Termos, item 5), limitação de responsabilidade (Termos, item 6) e classificação dos "recursos que você aciona" como dados que não dependem de consentimento.
2. **Identificação da controladora** (razão social e CNPJ): preencher `controllerLegalName`.
3. **Encarregado (art. 41):** indicar nome e contato em `dataProtectionOfficer`, ou confirmar a dispensa como agente de pequeno porte (Res. CD/ANPD nº 2/2022), mantendo o canal de contato.
4. **Canal de contato:** confirmar que `suporte@basesst.br` existe e é monitorado (o rodapé antigo apontava para `contato@sst.com`).
5. **Fornecedores:** confirmar hospedagem, banco de dados e envio de e-mails em produção, e se há **transferência internacional** de dados (inclusive Sentry, Google e GitHub). A política hoje cita apenas categorias de fornecedores.
6. **Configuração de produção:** confirmar nomes e prazos dos cookies, prazos dos links por e-mail e se `purge-expired` roda periodicamente; os textos usam os valores padrão do código.
7. **Retenção de logs** do AuthService e da hospedagem: não definida no projeto; não citada nos textos.
8. **Exclusão de conta:** não existe função para o titular nem para o administrador (só desativação). Hoje a exclusão depende de procedimento manual no banco; definir e documentar esse procedimento.
9. **Aceite de contas antigas:** contas que aceitaram a versão `2026-10-08` não são solicitadas a aceitar a nova; decidir se haverá novo aceite.
10. **Aviso de cookies sem monitoramento ativo:** sem `NEXT_PUBLIC_SENTRY_DSN`, o aviso pede uma escolha que só terá efeito se o monitoramento for ativado. Decidir se o aviso deve aparecer apenas quando houver recurso opcional ativo.
