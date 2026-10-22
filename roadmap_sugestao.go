// Package roadmap documenta a arquitetura madura, profissional e unificada
// para a plataforma "Base de Conhecimento".
//
// Evolução: Em vez de pastas com nomes herdados de "repositórios colados" (BaseCore + AuthService),
// o projeto adota o padrão de Monorepo Corporativo de alta maturidade (apps/ e packages/ ou apps/web + apps/api).
package main

import "fmt"

const ProjectDirectoryTree = `
================================================================================
ARVORE DE PASTAS: ESTRUTURA MONOREPO MODERNA E ELEGANTE (Padrao Enterprise)
================================================================================

Base_de_Conhecimento/
│
├── .github/                      # CI/CD, Automações e Pull Request Templates
│   └── workflows/
│       ├── test-web.yml          # Testes e validações do Frontend
│       ├── test-api.yml          # Testes e linters do Backend
│       └── deploy.yml            # Gatilhos de deploy coordenado
│
├── apps/                         # APLICAÇÕES EXECUTÁVEIS DO PROJETO
│   │
│   ├── web/                      # [Frontend] Next.js (App Router) + TypeScript
│   │   ├── src/
│   │   │   ├── app/              # Rotas e páginas (UI composition & layouts)
│   │   │   ├── components/       # Componentes visuais (design system / ui)
│   │   │   ├── features/         # Módulos de domínio (auth, knowledge, articles, search)
│   │   │   │   ├── auth/         # Telas, hooks e schemas de login/registro
│   │   │   │   └── articles/     # Listagem, leitura e edição de conhecimento
│   │   │   ├── hooks/            # Hooks customizados do React
│   │   │   └── lib/              # Clientes de API, instâncias e utilitários
│   │   ├── public/               # Ativos estáticos (ícones, logos, imagens)
│   │   ├── Dockerfile            # Container otimizado do Next.js
│   │   ├── package.json          # Dependências do frontend
│   │   └── tsconfig.json
│   │
│   └── api/                      # [Backend] FastAPI + Python (Modular Monolith)
│       ├── src/
│       │   ├── core/             # Configurações globais, segurança JWT, envs
│       │   ├── modules/          # Módulos desacoplados por funcionalidade
│       │   │   ├── auth/         # Autenticação, usuários, tokens, emails
│       │   │   │   ├── router.py
│       │   │   │   ├── service.py
│       │   │   │   ├── repository.py
│       │   │   │   └── schemas.py
│       │   │   └── knowledge/    # Base de Conhecimento (Artigos, Tags, Busca)
│       │   │       ├── router.py
│       │   │       ├── service.py
│       │   │       ├── repository.py
│       │   │       └── schemas.py
│       │   ├── database/         # Conexão SQLAlchemy, sessions e base models
│       │   └── main.py           # Ponto de entrada FastAPI unificado
│       ├── migrations/           # Versionamento do Banco (Alembic)
│       ├── tests/                # Testes automatizados (pytest)
│       ├── Dockerfile            # Container otimizado do Python
│       └── pyproject.toml        # Dependências e ferramentas do backend
│
├── packages/                     # CÓDIGO COMPARTILHADO (Opcional p/ escala futura)
│   ├── eslint-config/            # Regras unificadas de lint
│   └── openapi-types/            # Tipos TypeScript gerados da API FastAPI
│
├── deploy/                       # Artefatos de infraestrutura
│   ├── docker/
│   │   ├── compose.dev.yml       # Ambiente de desenvolvimento local unificado
│   │   └── compose.prod.yml      # Configuração para VPS / staging
│   └── render.yaml               # Blueprint declarativo da nuvem
│
├── docs/                         # Documentação viva do sistema
│   ├── architecture/             # Diagramas e ADRs (Architecture Decision Records)
│   └── guides/                   # Guias para novos desenvolvedores
│
├── .env.example                  # Template unificado de variáveis de ambiente
├── docker-compose.yml            # Orquestração local: 1 comando sobe tudo (Web, API, DB)
├── Makefile (ou run.ps1)         # Atalhos produtivos (make up, make test, make migrate)
└── README.md                     # Visão geral, onboarding e instruções
`

// Step representa uma etapa de maturidade do projeto.
type Step struct {
	Level       string
	Description string
}

func main() {
	// 1. Exibição direta da árvore para consulta imediata sem fadiga
	fmt.Print(ProjectDirectoryTree)

	// 2. Resumo executivo dos 4 pilares da nova arquitetura
	fmt.Println("\n================================================================================")
	fmt.Println("PILARES DA ARQUITETURA PROFISSIONAL UNIFICADA (apps/web + apps/api)")
	fmt.Println("================================================================================")

	pilares := []Step{
		{
			Level:       "1. Naming & Organização Padrão de Indústria",
			Description: "Substituir 'BaseCore' e 'AuthService' por 'apps/web' e 'apps/api'. Transmite a imagem de um produto único, coeso e corporativo.",
		},
		{
			Level:       "2. Monolito Modular no Backend (apps/api/src/modules/)",
			Description: "A autenticação deixa de ser um serviço isolado de fora e vira o módulo central (modules/auth), pronto para conviver lado a lado com o módulo de artigos (modules/knowledge).",
		},
		{
			Level:       "3. Orquestração Unificada (Root docker-compose.yml)",
			Description: "Um único arquivo orquestra o banco PostgreSQL, a API FastAPI e o Frontend Next.js com redes e volumes compartilhados claros.",
		},
		{
			Level:       "4. Independência de Deploy com Repositório Único",
			Description: "Vercel aponta para 'apps/web'. Render aponta para 'apps/api'. Supabase gerencia o PostgreSQL. Zero atrito e custo zero.",
		},
	}

	for _, p := range pilares {
		fmt.Printf("\n[%s]\n↳ %s\n", p.Level, p.Description)
	}
	fmt.Println("\n================================================================================")
}
