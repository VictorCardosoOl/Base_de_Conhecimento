import React from 'react';

export interface EditorialChapter {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  content: React.ReactNode[];
  callout?: React.ReactNode;
}

export const chapters: EditorialChapter[] = [
  {
    id: 'origem',
    number: '01',
    title: 'A Origem do Projeto',
    subtitle: 'De uma dor operacional a uma plataforma centralizada',
    content: [
      'A Base de Conhecimento nasceu de uma dor operacional percebida durante os meus primeiros meses de estágio. Em uma software house em franco crescimento, a cultura e os processos eram transmitidos quase exclusivamente de forma oral. Isso gerava ruídos de comunicação, impactava nossos tempos de resposta (SLA) e dificultava a integração de novos colaboradores.',
      'Ao identificar essa barreira, tomei a iniciativa de documentar e mapear fluxos de trabalho. A otimização foi tão expressiva que impulsionou minha promoção à liderança da equipe de treinamento. Passamos a documentar o conhecimento de forma colaborativa com o tempo, gerando um volume tão rico de material que rendeu a criação deste portal centralizado.',
      'Hoje, a plataforma é o coração operacional da equipe: estruturada sob uma arquitetura de CMS baseado em Git (Conteúdo como Código), ela oferece soluções em milissegundos sem depender de bancos de dados complexos, auxiliando diretamente na redução de erros e do turnover.'
    ],
    callout: <p className="text-sm opacity-70 mt-8">(Este projeto foi idealizado e arquitetado por mim, com a parceria essencial de Guilherme Cruz no apoio ao desenvolvimento e João Sanches na curadoria minuciosa do conteúdo).</p>
  },
  {
    id: 'papel',
    number: '02',
    title: 'O Papel e Escopo',
    subtitle: 'Visão Integral: Front-end, Arquitetura e Qualidade',
    content: [
      <span key="1">No centro do projeto, minha responsabilidade foi orquestrar a ponte entre um <strong>UX/UI de alto impacto</strong> e uma <strong>infraestrutura robusta</strong>. Trabalhando diretamente com a stack <strong>Next.js (App Router), TypeScript, e Tailwind CSS</strong>, o desafio foi construir não apenas uma página, mas uma plataforma resiliente.</span>,
      'Foquei intensamente na estabilidade estrutural e na entrega de uma interface que transparece fluidez, garantindo que o design estético nunca comprometesse a performance ou a testabilidade.'
    ],
    callout: (
      <div className="mt-8 pt-6 border-t border-black/10">
        <a href="https://github.com/VictorCardosoOl/Base_de_Conhecimento" target="_blank" rel="noopener noreferrer" className="inline-flex items-center font-medium hover:opacity-70 transition-opacity">
          Explore a arquitetura no repositório ↗
        </a>
      </div>
    )
  },
  {
    id: 'politica',
    number: '03',
    title: 'Controle de Acesso',
    subtitle: 'Política de Usuários e Controle',
    content: [
      <div key="c1" className="mb-6">
        <h4 className="text-xl font-serif mb-4 text-[#1a1a1a]">Contexto Original (Ambiente Corporativo)</h4>
        <p className="mb-4">Inicialmente, o projeto foi desenvolvido para o ambiente de intranet de uma software house, operando em servidores locais. Nessa fase inicial, a arquitetura de acessos foi estruturada em dois perfis distintos:</p>
        <ul className="list-disc pl-6 space-y-2 opacity-90">
          <li><strong>Administrador:</strong> Perfil com credenciais sob rigorosos critérios de segurança e privilégios elevados.</li>
          <li><strong>Usuário Comum:</strong> Perfil destinado aos colaboradores da empresa.</li>
        </ul>
      </div>,
      <div key="c2" className="mb-6">
        <h4 className="text-xl font-serif mb-4 text-[#1a1a1a]">Evolução para o Portfólio (Versão Lite)</h4>
        <p className="mb-4">Optamos por manter a estrutura de dois perfis, mas com focos adaptados para a versão pública:</p>
        <ul className="list-disc pl-6 space-y-2 opacity-90">
          <li><strong>Usuário de Avaliação (Recrutadores):</strong> Um perfil de teste criado especificamente para que recrutadores e avaliadores.</li>
          <li><strong>Usuário Comum (Leitor):</strong> Focado na experiência do usuário final, com acesso a Trilhas & Lista de Leitura.</li>
        </ul>
      </div>,
      <div key="c3">
        <h4 className="text-xl font-serif mb-4 text-[#1a1a1a]">Impacto Operacional e Regra de Negócio</h4>
        <p>A centralização do conhecimento na plataforma permitiu o autoatendimento para dúvidas recorrentes (como regras de eventos, prazos de transmissão, entre outros). Isso resultou na diminuição drástica dos gargalos e chamados no suporte técnico da operação.</p>
      </div>
    ]
  },
  {
    id: 'operacoes',
    number: '04',
    title: 'Operações e Qualidade',
    subtitle: 'Engenharia Contínua e Quality Gates',
    content: [
      <span key="1">A excelência de um software não nasce por acaso; ela é testada a cada commit. Implementamos um fluxo rígido e maduro de CI/CD via <strong>GitHub Actions</strong> (<code>ci-quality-gates.yml</code>).</span>,
      <span key="2">A equipe trabalhou em sinergia através de Code Reviews criteriosos. Para blindar a experiência do usuário e garantir a estabilidade da interface, integramos testes unitários com <strong>Vitest</strong> e estabelecemos uma suíte poderosa de testes End-to-End com <strong>Playwright</strong>, incluindo validações de acessibilidade (<code>accessibility.spec.ts</code>) e regressão visual (<code>visual-regression.spec.ts</code>).</span>
    ]
  },
  {
    id: 'desafios',
    number: '05',
    title: 'Desafios e Arquitetura',
    subtitle: 'Soluções Técnicas de Alta Complexidade',
    content: [
      <div key="d1" className="mb-8">
        <h3 className="text-2xl font-serif mb-4 leading-tight">Interações de Alta Fidelidade & PWA</h3>
        <p className="mb-4">A concepção de interações fluidas exigiu o desenvolvimento de componentes avançados como <code>SmoothScroll.tsx</code>, <code>KineticText.tsx</code> e uma <code>CommandPalette.tsx</code>. O desafio foi manter a taxa de quadros alta durante animações complexas.</p>
        <p>Além disso, elevamos a web app a um novo patamar com capacidades de <strong>Progressive Web App (PWA)</strong>, transformando a plataforma em uma experiência similar a um app nativo.</p>
      </div>,
      <div key="d2">
        <h3 className="text-2xl font-serif mb-4 leading-tight">Parsers de Markdown e Busca</h3>
        <p>A gestão de conteúdo em larga escala exigiu uma arquitetura inteligente. Estruturamos o sistema para processar arquivos via <code>markdown.ts</code> e organizar metadados com <code>mapping.ts</code>. Para navegação rápida, o hook <code>use-search.ts</code> foi otimizado para lidar com requisições em tempo real.</p>
      </div>
    ]
  },
  {
    id: 'impacto',
    number: '06',
    title: 'O Impacto',
    subtitle: 'Performance e Crescimento Mútuo',
    content: [
      'A evolução do projeto não se resume a métricas (embora superamos gargalos significativos de bundle size e LCP), mas sim na sinergia da equipe. Aprender a escalar um projeto mantendo a barra de qualidade alta reforçou a importância da comunicação clara entre design e engenharia.'
    ]
  }
];
