# ADR-0014: Aceite dos termos e perfil complementar opcional

- Status: aceito
- Data: 2026-10-08

## Contexto

O cadastro (com senha ou por login social) passa a exigir o aceite dos Termos de Uso e da Política de Privacidade, com prova do consentimento. Também foram pedidos campos de perfil complementares, todos opcionais e justificados pelo princípio da necessidade (minimização) da LGPD.

## Decisão

**Aceite dos termos (`auth.terms_acceptances`)**

- Os corpos de cadastro exigem `accept_terms: true`, `terms_version` e `privacy_version`. As versões precisam ser as vigentes (`TERMS_VERSION`, `PRIVACY_POLICY_VERSION`); outra versão → `400` com `field=terms_version`/`privacy_version` ("recarregue e leia a versão atual").
- Cada aceite vira uma linha: usuário, versões, data (`accepted_at`), método (`password`/`oauth`) e IP (`CONSENT_RECORD_IP`, padrão ligado). Quando os documentos mudarem, um novo aceite vira nova linha e o histórico serve de prova (LGPD, art. 8º, §2º: o ônus da prova do consentimento é do controlador).
- As versões exibidas pela Base de Conhecimento (`src/features/legal/documents.ts`) e as do AuthService precisam andar juntas.

**Perfil complementar (opcional)**

| Campo | Por quê |
| --- | --- |
| `organization` (até 120) | Contexto para quem aprova pedidos de acesso de editor e para o suporte. |
| `professional_area` (lista fechada) | Indica quais módulos (eSocial, GRO, Financeiro...) são mais úteis; ajuda a priorizar conteúdo. Lista fechada evita texto livre com dados pessoais. |

Ficaram **de fora** de propósito: CPF, telefone, data de nascimento, cargo detalhado e endereço. Nenhuma funcionalidade da base precisa deles.

## Trade-offs

- **Contas antigas sem aceite registrado:** a migration não inventa aceites. Pedir o aceite no próximo acesso é uma decisão em aberto.
- **IP no aceite:** é dado pessoal; serve de prova do consentimento. Pode ser desligado por configuração; a retenção acompanha a da conta (apagado junto, por `ON DELETE CASCADE`).
- **Sem edição do perfil (ainda):** os campos opcionais só são informados no cadastro; a edição em "Minha conta" fica para uma próxima etapa (direito de correção, LGPD art. 18, III, hoje atendido pelo administrador).
