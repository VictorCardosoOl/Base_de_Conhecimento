# SST FAQ — Base de Conhecimento de Alta Performance

> Solução centralizada de documentação técnica, normas e diretrizes de Saúde e Segurança do Trabalho projetada para acelerar o onboarding de novos colaboradores e eliminar gargalos operacionais.

![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

Plataforma de documentação corporativa e suporte normativo em SST focada em rapidez de consulta e conformidade regulatória. O sistema resolve a dispersão de informações críticas (eSocial, eventos S-2210/S-2220/S-2240, NRs e rotinas previdenciárias), reduzindo o tempo de resolução de dúvidas técnicas do time. Construído como um PWA offline-first, combina compilação estática de conteúdo com carregamento sob demanda para garantir navegação instantânea em qualquer dispositivo.

---

## 🚀 Visão de Produto (Features)

* **Busca Fuzzy Instantânea (Zero-Latency):** Mecanismo de busca local tolerante a erros de digitação e acentuação, com indexação pré-compilada para respostas imediatas sem requisições adicionais ao servidor.
* **Command Palette Global (`Cmd+K` / `Ctrl+K`):** Navegação rápida orientada ao teclado para localização de tópicos, atalhos e seções normativas.
* **Suporte PWA Offline-First:** Aplicação instalável em desktop e mobile com Service Worker configurado para cache de assets e consulta a conteúdos críticos mesmo sem conexão à rede.
* **Leitura com Tipografia Fluida e Alta Legibilidade:** Renderização de Markdown sanitizado com formatação técnica elegante, tabelas comparativas, destaques de advertência e navegação ancorada.
* **Organização Modular por Domínios SST:** Classificação clara entre Previdenciário, eSocial, Saúde e Segurança, e Resolução de Problemas Técnicos.

---

## 🧠 Arquitetura e Engenharia

### 1. Pipeline de Conteúdo Estático & Code-Splitting Sob Demanda
O projeto não trafega toda a base documental no bundle inicial. Um script de build customizado (`scripts/generate-catalog.js`) lê arquivos Markdown brutos, processa o frontmatter com `gray-matter`, extrai o texto plano para alimentar o índice de busca e compila cada artigo em chunks JSON independentes na pasta `src/data/chunks/`. Uma tabela de mapeamento tipada (`src/data/mapping.ts`) permite o *lazy loading* do corpo do artigo apenas quando a rota correspondente é acessada.

### 2. Separação Estrita de Responsabilidades (SoC)
* **`src/content/`:** Repositório desacoplado de dados em Markdown para facilitar a contribuição editorial sem risco de quebra de componentes.
* **`src/hooks/`:** Encapsulamento de regras de negócio, persistência de preferências locais e ciclo de vida de busca.
* **`src/components/` & `src/layouts/`:** Componentes de apresentação isolados, acessíveis e focados em renderização idempotente.

### 3. Sanitização e Segurança em Tempo de Execução
Todo Markdown dinâmico é sanitizado via `DOMPurify` antes da injeção no DOM, eliminando vetores de ataque Cross-Site Scripting (XSS) em links ou blocos de código externos.

### 4. Qualidade e Resiliência
* **Testes Automatizados:** Suíte de testes com `Vitest` e `Testing Library` para verificação de montagem, filtros de busca e integridade de componentes de interface.
* **Tipagem Estrita:** TypeScript configurado com checagem rígida de interfaces para metadados de artigos, categorias e retornos de busca.
* **Pipeline de Deploy Automatizado:** Integração contínua e deploy otimizado com execução do script de catálogo antes de cada compilação de produção (`npm run gen:catalog && vite build`).

---

## 💻 Stack Tecnológico

| Camada | Tecnologias | Finalidade |
| :--- | :--- | :--- |
| **Frontend Core** | React 19, TypeScript 5.8 | Camada declarativa reativa com tipagem estrita |
| **Build & Tooling** | Vite 6, PostCSS, Autoprefixer | Empacotamento ultrarrápido com Hot Module Replacement |
| **Estilização** | Tailwind CSS 4, Tailwind Typography | Design system utilitário com controle tipográfico para artigos |
| **Interação & UI** | CMDK, Framer Motion, Lenis | Paleta de comandos universal e animações fluidas |
| **Mecanismo de Busca**| Fuse.js | Busca fuzzy client-side sobre catálogo pré-indexado |
| **Parsing & Segurança**| Marked, DOMPurify, Gray-Matter | Extração de metadados, parsing de Markdown e sanitização XSS |
| **Armazenamento & PWA**| Vite PWA (Workbox) | Estratégia de cache offline e manifesto de aplicação instalável |
| **Testes** | Vitest, Testing Library React | Execução rápida de testes unitários e de integração de UI |

---

## 🛠️ Quick Start (Guia de Execução)

### Pré-requisitos
* **Node.js:** `>= 18.x`
* **npm:** `>= 9.x`

### 1. Clonar o repositório e instalar dependências
```bash
git clone https://github.com/VictorCardosoOl/FAQSST.git
cd FAQSST
npm install
```

### 2. Iniciar em ambiente de desenvolvimento
O comando gera o catálogo de artigos e inicia o servidor Vite local:
```bash
npm run dev
```
Acesse a aplicação em `http://localhost:3000`.

### 3. Executar suíte de testes
```bash
npm run test
```

### 4. Build de produção
```bash
npm run build
```

---

## 📬 Contato

**Victor Cardoso Cunha**  
Engenheiro de Software / Freelance Developer  
[LinkedIn: Victor Cardoso Cunha](https://linkedin.com/in/victorcardosocunha)
