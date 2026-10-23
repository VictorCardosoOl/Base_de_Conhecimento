# 👥 Página "Sobre"

Rota `/sobre`. Conteúdo em `src/features/sobre/about-content.ts` (texto sem JSX) e página em `src/app/sobre/page.tsx`, montada só com componentes e materiais do design system: superfície de leitura no texto corrido, cartões sem desfoque, entrada ao rolar pelo `[data-reveal]` global. Não há mais exceção da rota no `ClientLayout`.

---

## Origem das informações

| Conteúdo | Fonte |
| --- | --- |
| Origem (conhecimento transmitido oralmente, documentação colaborativa, portal único) | README, "A origem do projeto" |
| Número de artigos e de módulos | catálogo gerado no build (`FAQ_DATA`) |
| Ciclo de revisão de 12 meses (padrão) | `catalog.ts` e painel (`validityOf`) |
| Público (áreas de atuação) | AuthService, `ProfessionalArea` |
| Recursos (busca, leitura, Minha Lista, participação, revisão) | código das respectivas funcionalidades |
| Testes de acessibilidade WCAG 2.1 AA | `e2e/accessibility.spec.ts`, `e2e/auth-screens.spec.ts` |
| Monitoramento só com consentimento | `telemetry.ts`, página de cookies |
| Repositório público | GitHub (respondeu 200 em 10/10/2026) |
| Equipe | dados que estavam em `src/data/sobre-chapters.tsx` |

---

## Retirado da versão anterior (sem respaldo ou desatualizado)

- "Sem depender de bancos de dados": contas e interações usam PostgreSQL.
- Dois perfis, incluindo "Usuário de Avaliação (Recrutadores)": hoje existem três papéis e não há perfil de recrutador.
- Componentes inexistentes (`SmoothScroll.tsx`, `KineticText.tsx`, `markdown.ts`) e a afirmação de PWA "similar a app nativo" (não há service worker).
- Resultados sem dado: "diminuição drástica dos chamados", redução de erros e de turnover, promoção, ganhos de LCP e bundle.
- "ESTD 2026", nome antigo "SST FAQ" e narrativa em primeira pessoa.

---

## Seções sobre as pessoas

- **Quem faz a Base SST** (`MAINTAINERS`): Victor Cardoso e Guilherme Cruz, em blocos alternados (zigue-zague só no desktop, via grade; HTML sempre na ordem foto → texto → link).
- **Consultoria técnica** (`CONSULTANTS`): Sabrina Fraguela e João Sanchez, em cartões quadrados com um único link de perfil.
- Componentes: `src/features/sobre/components/People.tsx`; ícones de LinkedIn e GitHub em `src/components/ui/BrandIcons.tsx` (o lucide-react 1.x não os inclui).
- Fontes dos textos: README (Créditos), dados da equipe que já existiam no projeto e autoria dos commits no git. Links: os informados pelo responsável pelo projeto em 10/10/2026.

---

## Pendências (dependem de confirmação)

1. **Bios:** formação e trajetória de Victor Cardoso e Guilherme Cruz não foram fornecidas; os textos atuais usam só o que é verificável no projeto.
2. **Fotos:** nenhuma foto autorizada foi fornecida; as cinco pessoas aparecem com iniciais. Para usar fotos, salve-as em `public/equipe/` (WebP, retrato 4:5 para Victor e Guilherme) e preencha `photo` em `about-content.ts`.
3. **Consultoria:** funções e contribuições vêm de uma frase por pessoa nos dados do projeto; confirmar e detalhar as contribuições de Sabrina e João.
4. **Nomes:** "Victor Cardoso" (git e README usam "Victor Cardoso Cunha"); "João Sanchez" (README usa "João Sanches").
5. **LinkedIn:** o perfil de Sabrina responde com bloqueio a robôs (código 999) e não pôde ser verificado automaticamente; confirmar que está ativo.
6. **Empresa de origem:** se e como citar a organização onde o projeto nasceu.
7. **Resultados:** só voltar a citar ganhos (chamados, tempo de resposta, integração de novas pessoas) com dados medidos.
8. **Contato:** confirmar `suporte@basesst.br`.
9. **Cadastro público:** "Criar conta" depende de `PUBLIC_REGISTRATION_ENABLED` no AuthService (padrão desligado).
10. **`IntroHero`:** componente antigo exibido em `/?category=Sobre`; avaliar remoção em outra etapa.
