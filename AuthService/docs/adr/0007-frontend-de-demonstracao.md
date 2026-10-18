# ADR-0007: Adaptação do frontend de demonstração ao fluxo por cookies

- Status: aceito
- Data: 2026-09-27

## Contexto

O frontend embutido gravava **a senha em texto puro e o JWT** no `sessionStorage`, exibia os dois na tela e usava `/register` e `/token`. Isso é incompatível com os ADRs 0001, 0002 e 0005.

## Decisão

Manter o frontend (ele faz parte da demonstração do projeto), adaptado:

- login via `POST /auth/login`;
- sessão lida de `/auth/me`;
- renovação automática em `SESSION_EXPIRED`, com uma única tentativa;
- logout e logout-all reais;
- remoção das chaves antigas do `sessionStorage`;
- mensagens renderizadas como texto (não HTML);
- o formulário de cadastro virou um aviso de "acesso por convite".

A Base de Conhecimento continua sendo a interface principal. O frontend embutido é só para demonstrar o serviço isoladamente.
