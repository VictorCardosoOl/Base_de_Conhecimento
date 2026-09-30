'use client';

import React, { useState } from 'react';

const chapters = [
  {
    id: 'introducao',
    title: 'Introdução',
    bgClass: 'bg-[#f8f8f6] text-[#111]',
    content: (
      <div className="flex flex-col justify-end min-h-full pb-24">
        <div className="max-w-5xl">
          <p className="text-sm md:text-base tracking-widest uppercase opacity-60 mb-4 font-mono">
            Estudo de Caso / 2026
          </p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter leading-[0.9] mb-8">
            Engenharia,
            <br />
            Arte &amp; Sistemas.
          </h1>
          <p className="text-lg md:text-2xl font-light opacity-80 max-w-2xl leading-relaxed">
            Uma imersão técnica e criativa na arquitetura e nas decisões que
            moldaram a Base de Conhecimento.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'origem',
    title: 'A Origem do Projeto',
    bgClass: 'bg-[#f4f4f0] text-[#111]',
    content: (
      <div className="max-w-4xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8">
          01 / A Origem do Projeto
        </h2>
        <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">
          De uma dor operacional a uma plataforma centralizada
        </h3>
        <div className="space-y-6 text-lg font-light text-gray-700 leading-relaxed">
          <p>
            A Base de Conhecimento nasceu de uma dor operacional percebida
            durante os meus primeiros meses de estágio. Em uma software house em
            franco crescimento, a cultura e os processos eram transmitidos quase
            exclusivamente de forma oral. Isso gerava ruídos de comunicação,
            impactava nossos tempos de resposta (SLA) e dificultava a integração
            de novos colaboradores.
          </p>
          <p>
            Ao identificar essa barreira, tomei a iniciativa de documentar e
            mapear fluxos de trabalho. A otimização foi tão expressiva que
            impulsionou minha promoção à liderança da equipe de treinamento.
            Passamos a documentar o conhecimento de forma colaborativa com o
            tempo, gerando um volume tão rico de material que rendeu a criação
            deste portal centralizado.
          </p>
          <p>
            Hoje, a plataforma é o coração operacional da equipe: estruturada
            sob uma arquitetura de CMS baseado em Git (Conteúdo como Código),
            ela oferece soluções em milissegundos sem depender de bancos de
            dados complexos, auxiliando diretamente na redução de erros e do
            turnover.
          </p>
          <p className="text-sm opacity-70 mt-8">
            (Este projeto foi idealizado e arquitetado por mim, com a parceria
            essencial de Guilherme Cruz no apoio ao desenvolvimento e João
            Sanches na curadoria minuciosa do conteúdo).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'papel',
    title: 'O Papel e Escopo',
    bgClass: 'bg-[#f0f0ea] text-[#111]',
    content: (
      <div className="max-w-4xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8">
          02 / O Papel & O Escopo
        </h2>
        <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">
          Visão Integral: Front-end, Arquitetura e Qualidade
        </h3>
        <div className="space-y-6 text-lg font-light text-gray-700 leading-relaxed">
          <p>
            No centro do projeto, minha responsabilidade foi orquestrar a ponte
            entre um <strong>UX/UI de alto impacto</strong> e uma{' '}
            <strong>infraestrutura robusta</strong>. Trabalhando diretamente com
            a stack{' '}
            <strong>Next.js (App Router), TypeScript, e Tailwind CSS</strong>, o
            desafio foi construir não apenas uma página, mas uma plataforma
            resiliente.
          </p>
          <p>
            Foquei intensamente na estabilidade estrutural e na entrega de uma
            interface que transparece fluidez, garantindo que o design estético
            nunca comprometesse a performance ou a testabilidade.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'politica',
    title: 'Política de Usuários',
    bgClass: 'bg-[#ebebe3] text-[#111]',
    content: (
      <div className="max-w-4xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8">
          03 / Controle de Acesso
        </h2>
        <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">
          Política de Usuários e Controle de Acesso
        </h3>

        <div className="space-y-8 text-lg font-light text-gray-700 leading-relaxed">
          <div>
            <h4 className="text-xl font-medium mb-4 text-[#111]">
              Contexto Original (Ambiente Corporativo)
            </h4>
            <p className="mb-4">
              Inicialmente, o projeto foi desenvolvido para o ambiente de
              intranet de uma software house, operando em servidores locais.
              Nessa fase inicial, a arquitetura de acessos foi estruturada em
              dois perfis distintos:
            </p>
            <ul className="list-disc pl-6 space-y-2 opacity-90">
              <li>
                <strong>Administrador:</strong> Perfil com credenciais sob
                rigorosos critérios de segurança e privilégios elevados,
                responsável pelo gerenciamento do sistema e pela criação de
                novas contas.
              </li>
              <li>
                <strong>Usuário Comum:</strong> Perfil destinado aos
                colaboradores da empresa. As credenciais eram distribuídas para
                a equipe já ativa e entregues aos novos funcionários durante o
                processo de integração (onboarding).
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-medium mb-4 text-[#111]">
              Evolução para o Portfólio (Versão Lite)
            </h4>
            <p className="mb-4">
              Com a autorização para publicarmos uma versão Lite do projeto no
              GitHub — com o objetivo de demonstrar nossa capacidade técnica e
              compor nosso portfólio —, a equipe realizou uma revisão
              estratégica na política de usuários para adequá-la ao contexto
              público. Optamos por manter a estrutura de dois perfis, mas com
              focos adaptados:
            </p>
            <ul className="list-disc pl-6 space-y-2 opacity-90">
              <li>
                <strong>Usuário de Avaliação (Recrutadores):</strong> Um perfil
                de teste criado especificamente para que recrutadores e
                avaliadores técnicos possam explorar os módulos e validar as
                funcionalidades da plataforma na prática.
              </li>
              <li>
                <strong>Usuário Comum (Leitor):</strong> Focado na experiência
                do usuário final. Este perfil possui acesso a recursos de
                engajamento, como a aba "Trilhas & Lista de Leitura". Nela, o
                usuário pode definir metas, visualizar seu progresso e
                engajamento, além de ajustar configurações para otimizar sua
                exploração no projeto.
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xl font-medium mb-4 text-[#111]">
              Impacto Operacional e Regra de Negócio
            </h4>
            <p className="mb-4">
              A decisão de investir nesses recursos de leitura e engajamento
              baseou-se em uma dor real da nossa operação. Nos primeiros dias de
              integração, muitos colaboradores do cliente final não possuíam
              conhecimento aprofundado sobre as regras de negócio da área.
            </p>
            <p>
              A centralização do conhecimento na plataforma permitiu o
              autoatendimento para dúvidas recorrentes (como regras de eventos,
              prazos de transmissão, entre outros). Isso resultou na diminuição
              drástica dos gargalos e chamados no suporte técnico da operação,
              garantindo que a informação ficasse acessível de forma rápida e
              intuitiva.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'operacoes',
    title: 'Operações e Qualidade',
    bgClass: 'bg-[#e6e6dc] text-[#111]',
    content: (
      <div className="max-w-4xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8">
          04 / Operações & Qualidade
        </h2>
        <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">
          Engenharia Contínua e Quality Gates
        </h3>
        <div className="space-y-6 text-lg font-light text-gray-700 leading-relaxed">
          <p>
            A excelência de um software não nasce por acaso; ela é testada a
            cada commit. Implementamos um fluxo rígido e maduro de CI/CD via{' '}
            <strong>GitHub Actions</strong> (<code>ci-quality-gates.yml</code>).
          </p>
          <p>
            A equipe trabalhou em sinergia através de Code Reviews criteriosos.
            Para blindar a experiência do usuário e garantir a estabilidade da
            interface, integramos testes unitários com <strong>Vitest</strong> e
            estabelecemos uma suíte poderosa de testes End-to-End com{' '}
            <strong>Playwright</strong>, incluindo validações de acessibilidade
            (<code>accessibility.spec.ts</code>) e regressão visual (
            <code>visual-regression.spec.ts</code>).
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'desafios',
    title: 'Desafios e Arquitetura',
    bgClass: 'bg-[#e1e1d5] text-[#111]',
    content: (
      <div className="max-w-4xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8">
          05 / Desafios & Arquitetura
        </h2>
        <div className="space-y-16">
          <div>
            <h3 className="text-3xl md:text-4xl font-normal mb-6 leading-tight">
              Interações de Alta Fidelidade & PWA
            </h3>
            <p className="text-lg font-light text-gray-700 leading-relaxed mb-6">
              A concepção de interações fluidas exigiu o desenvolvimento de
              componentes avançados como <code>SmoothScroll.tsx</code>,{' '}
              <code>KineticText.tsx</code> e uma <code>CommandPalette.tsx</code>
              . O desafio foi manter a taxa de quadros alta durante animações
              complexas, utilizando técnicas de aceleração por hardware e
              gerenciamento eficiente de estado no React.
            </p>
            <p className="text-lg font-light text-gray-700 leading-relaxed">
              Além disso, elevamos a web app a um novo patamar com capacidades
              de <strong>Progressive Web App (PWA)</strong>, transformando a
              plataforma em uma experiência similar a um app nativo, essencial
              para a leitura imersiva do glossário e guia.
            </p>
          </div>
          <div>
            <h3 className="text-3xl md:text-4xl font-normal mb-6 leading-tight">
              Parsers de Markdown e Busca
            </h3>
            <p className="text-lg font-light text-gray-700 leading-relaxed">
              A gestão de conteúdo em larga escala exigiu uma arquitetura
              inteligente. Estruturamos o sistema para processar arquivos via{' '}
              <code>markdown.ts</code> e organizar metadados com{' '}
              <code>mapping.ts</code>. Para navegação rápida, o hook{' '}
              <code>use-search.ts</code> foi otimizado para lidar com
              requisições em tempo real, integrando-se perfeitamente à interface
              de busca.
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'impacto',
    title: 'O Impacto',
    bgClass: 'bg-[#dcdccf] text-[#111]',
    content: (
      <div className="max-w-4xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8">
          06 / O Impacto
        </h2>
        <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">
          Performance e Crescimento Mútuo
        </h3>
        <p className="text-lg font-light text-gray-700 leading-relaxed mb-6">
          A evolução do projeto não se resume a métricas (embora superamos
          gargalos significativos de bundle size e LCP), mas sim na sinergia da
          equipe. Aprender a escalar um projeto mantendo a barra de qualidade
          alta reforçou a importância da comunicação clara entre design e
          engenharia.
        </p>
      </div>
    ),
  },
  {
    id: 'equipe',
    title: 'A Equipe',
    bgClass: 'bg-[#111111] text-[#f5f5f5]',
    content: (
      <div className="max-w-5xl py-24">
        <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-8 text-center">
          07 / Créditos
        </h2>
        <h3 className="text-5xl md:text-7xl font-medium tracking-tighter text-center mb-6">
          As Pessoas
        </h3>
        <p className="text-xl font-light opacity-80 max-w-2xl mx-auto text-center mb-24">
          A tecnologia é apenas a ferramenta; o talento humano é o que constrói
          a visão.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {[
            'Engenharia / QA',
            'Design / UX',
            'Product Owner',
            'Fullstack Dev',
          ].map((role, idx) => (
            <div key={idx} className="group block cursor-pointer">
              <div className="aspect-[3/4] bg-gray-800 w-full mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gray-700 transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"></div>
              </div>
              <h4 className="text-xl font-medium mb-1">Membro da Equipe</h4>
              <p className="text-sm opacity-60 font-mono uppercase">{role}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

import { motion, AnimatePresence } from 'framer-motion';

export function SobreAccordion() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  return (
    <div className="flex w-full h-[100dvh] overflow-hidden bg-black selection:bg-black selection:text-white">
      {chapters.map((chapter, index) => {
        const isActive = index === activeIndex;
        const isHovered = index === hoverIndex;
        const isPast = index < activeIndex;

        // Base widths for collapsed state
        const collapsedWidth = 'w-14 md:w-20 lg:w-24';
        const widthClass = isActive ? 'flex-1 min-w-0' : collapsedWidth;

        return (
          <motion.div
            layout
            key={chapter.id}
            initial={false}
            animate={{
              x: isHovered && !isActive ? 12 : 0,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 30,
              mass: 1,
            }}
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
            onClick={() => !isActive && setActiveIndex(index)}
            className={`
              relative h-full flex-shrink-0 flex flex-col 
              cursor-pointer overflow-hidden border-r border-black/10 dark:border-white/5
              ${widthClass} ${chapter.bgClass}
              ${isActive ? 'cursor-default' : 'group hover:z-10 hover:shadow-xl'}
            `}
          >
            {/* Title for collapsed state */}
            <div
              className={`
                absolute inset-0 flex flex-col items-center justify-center
                transition-all duration-500 ease-out
                ${isActive ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'}
              `}
            >
              <span
                className={`
                  whitespace-nowrap text-sm md:text-base uppercase tracking-[0.3em] font-mono z-10
                  transition-all duration-300 ease-out
                  ${isHovered ? 'opacity-100' : 'opacity-70'}
                `}
                style={{
                  writingMode: 'vertical-rl',
                  transform: 'rotate(180deg)',
                }}
              >
                {chapter.title}
              </span>
            </div>

            {/* Content for expanded state */}
            <div
              className={`
                absolute inset-0 overflow-y-auto no-scrollbar
                transition-all duration-700 delay-100 ease-out
                ${isActive ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}
              `}
              data-lenis-prevent
            >
              <div className="min-h-full h-full px-6 md:px-12 lg:px-20 xl:px-32 lg:pl-[120px] 2xl:pl-[160px] max-w-[2000px] mx-auto">
                {chapter.content}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
