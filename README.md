# SST FAQ — Base de Conhecimento de Alta Performance

> Solução centralizada de documentação técnica, normas e diretrizes de Saúde e Segurança do Trabalho projetada para acelerar o onboarding de novos colaboradores e eliminar gargalos operacionais.

![React 19](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?logo=vite&logoColor=white)
![PWA Ready](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.1-38B2AC?logo=tailwind-css&logoColor=white)
![Clean Code](https://img.shields.io/badge/Architecture-Clean%20Code-brightgreen)

---

Plataforma de documentação corporativa e suporte normativo em SST focada em rapidez de consulta e conformidade regulatória. O sistema resolve a dispersão de informações críticas (eSocial, eventos S-2210/S-2220/S-2240, NRs e rotinas previdenciárias), reduzindo o tempo de resolução de dúvidas técnicas do time. Construído como um **PWA offline-first**, combina compilação estática de conteúdo com carregamento sob demanda para garantir navegação instantânea em qualquer dispositivo.

---

## 🚀 Visão de Produto (Features)

* **Busca Fuzzy Instantânea (Zero-Latency):** Mecanismo de busca local com `fuse.js`, indexação pré-compilada, suportando erros de digitação e acentuação.
* **Command Palette Global (`Cmd+K` / `Ctrl+K`):** Navegação rápida orientada ao teclado.
* **Suporte PWA Offline-First Extremo:** Application cache avançado via Workbox. A aplicação pode ser acessada totalmente offline, cacheando bibliotecas, fontes e JSONs de artigos agressivamente.
* **Leitura Fluida e Legível:** Renderização de Markdown sanitizado (`DOMPurify`), tipografia Tailwind adaptativa com injeção automática de tooltips de glossário.
* **SEO & Compartilhamento Aprimorados:** O projeto suporta tags OpenGraph (OG) e Twitter Cards, carregando metadados enriquecidos no compartilhamento de links.

---

## 🧠 Engenharia e Padrões de Qualidade (Clean Code)

O repositório opera sob padrões estritos de engenharia moderna de Frontend:

### 1. Separação Estrita de Responsabilidades (SRP)
Os componentes de UI são extremamente atomizados. Modelos de "God Components" foram refatorados para garantir isolamento:
- `ArticleView` atua apenas como orquestrador, delegando a UI para `ArticleHeader`, `ArticleContent`, `ArticleRelated` e `ArticleFooterNav`.
- **Acessibilidade (WCAG 2.1)** implementada rigorosamente com uso de tags semânticas e suporte total a navegação por teclado (Enter, Espaço, Esc).

### 2. Design System Nativo (Tailwind v4)
Em vez de mapeamentos manuais em hexadecimais rígidos, o sistema consome os tokens nativos do Tailwind v4 ancorados em variáveis CSS dinâmicas. Isso permite transições fluidas, idênticas e globais de **Dark/Light Mode** que afetam bordas, textos e fundos simultaneamente com zero esforço em nível de componente.

### 3. Pipeline de Conteúdo e Lazy Loading
O projeto processa arquivos `.md` brutos em build-time (`scripts/generate-catalog.js`) e os compila em _chunks JSON_. Uma tabela de roteamento tipada (`src/data/mapping.ts`) invoca o carregamento do conteúdo (`import()`) apenas quando a página é visitada.

### 4. Vendor Splitting e Vite Performance
Configuração nativa no Vite separa bibliotecas pesadas em chunks individuais (`react-vendor`, `ui-vendor`, `utils-vendor`). Assim, ao atualizar o conteúdo da aplicação, os caches dos navegadores para bibliotecas como Framer Motion ou DOMPurify permanecem intactos.

---

## 💻 Stack Tecnológico

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend Core** | React 19, TypeScript 5.8 |
| **Build & Bundle** | Vite 6, PostCSS, Vendor Splitting Ativo |
| **Estilização** | Tailwind CSS 4, Tailwind Typography |
| **Interação & UI** | CMDK, Framer Motion, Lenis |
| **Busca & Markdown**| Fuse.js, Marked, DOMPurify, Gray-Matter |
| **Infraestrutura**| Vite PWA (Workbox - CacheFirst Strategies), React Helmet Async (SEO) |

---

## 🛠️ Quick Start e Contribuição

Para orientações sobre como adicionar artigos, padrões de commit e estruturação de novos componentes, **LEIA O GUIA OFICIAL DE CONTRIBUIÇÃO:**
👉 [CONTRIBUTING.md](./CONTRIBUTING.md)

### Rodando o Projeto (Dev)
```bash
git clone https://github.com/VictorCardosoOl/FAQSST.git
cd FAQSST
npm install
npm run dev
```

### Build de Produção
```bash
npm run build
```

---

## 📬 Contato

**Victor Cardoso Cunha**  
Engenheiro de Software / Freelance Developer  
[LinkedIn: Victor Cardoso Cunha](https://linkedin.com/in/victorcardosocunha)
