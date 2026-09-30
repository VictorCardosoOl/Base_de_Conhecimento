import React from "react";

export const metadata = {
  title: "Sobre o Projeto | Estudo de Caso",
  description: "Arquitetura, Design e Engenharia por trás da Base de Conhecimento.",
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f5f5f5] selection:bg-white selection:text-black font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col justify-end p-8 md:p-16 lg:p-24 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] border-b border-[#333]">
        <div className="max-w-5xl">
          <p className="text-sm md:text-base tracking-widest uppercase opacity-60 mb-4 font-mono">Estudo de Caso / 2026</p>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-medium tracking-tighter leading-[0.9] mb-8">
            Engenharia,<br />
            Arte &amp; Sistemas.
          </h1>
          <p className="text-lg md:text-2xl font-light opacity-80 max-w-2xl leading-relaxed">
            Uma imersão técnica e criativa na arquitetura e nas decisões que moldaram a Base de Conhecimento.
          </p>
        </div>
      </section>

      {/* 1. O Meu Papel Específico */}
      <section className="py-24 px-8 md:px-16 lg:px-24 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] border-b border-[#222]">
        <div className="max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono sticky top-24">01 / O Papel & O Escopo</h2>
          </div>
          <div className="md:col-span-8">
            <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">Visão Integral: Front-end, Arquitetura e Qualidade</h3>
            <div className="space-y-6 text-lg font-light text-gray-300 leading-relaxed">
              <p>
                No centro do projeto, minha responsabilidade foi orquestrar a ponte entre um <strong>UX/UI de alto impacto</strong> e uma <strong>infraestrutura robusta</strong>.
                Trabalhando diretamente com a stack <strong>Next.js (App Router), TypeScript, e Tailwind CSS</strong>, o desafio foi construir não apenas uma página, mas uma plataforma resiliente.
              </p>
              <p>
                Foquei intensamente na estabilidade estrutural e na entrega de uma interface que transparece fluidez, garantindo que o design estético nunca comprometesse a performance ou a testabilidade.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Dinâmica de Colaboração e Processos */}
      <section className="py-24 px-8 md:px-16 lg:px-24 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] border-b border-[#222]">
        <div className="max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono sticky top-24">02 / Operações & Qualidade</h2>
          </div>
          <div className="md:col-span-8">
            <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">Engenharia Contínua e Quality Gates</h3>
            <div className="space-y-6 text-lg font-light text-gray-300 leading-relaxed">
              <p>
                A excelência de um software não nasce por acaso; ela é testada a cada commit. Implementamos um fluxo rígido e maduro de CI/CD via <strong>GitHub Actions</strong> (<code>ci-quality-gates.yml</code>).
              </p>
              <p>
                A equipe trabalhou em sinergia através de Code Reviews criteriosos. Para blindar a experiência do usuário e garantir a estabilidade da interface, integramos testes unitários com <strong>Vitest</strong> e estabelecemos uma suíte poderosa de testes End-to-End com <strong>Playwright</strong>, incluindo validações de acessibilidade (<code>accessibility.spec.ts</code>) e regressão visual (<code>visual-regression.spec.ts</code>).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Desafios Técnicos e 4. Arquitetura */}
      <section className="py-24 px-8 md:px-16 lg:px-24 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] border-b border-[#222]">
        <div className="max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono sticky top-24">03 / Desafios & Arquitetura</h2>
          </div>
          <div className="md:col-span-8">
            <div className="space-y-16">
              <div>
                <h3 className="text-3xl md:text-4xl font-normal mb-6 leading-tight">Interações de Alta Fidelidade & PWA</h3>
                <p className="text-lg font-light text-gray-300 leading-relaxed mb-6">
                  A concepção de interações fluidas exigiu o desenvolvimento de componentes avançados como <code>SmoothScroll.tsx</code>, <code>KineticText.tsx</code> e uma <code>CommandPalette.tsx</code>. O desafio foi manter a taxa de quadros alta durante animações complexas, utilizando técnicas de aceleração por hardware e gerenciamento eficiente de estado no React.
                </p>
                <p className="text-lg font-light text-gray-300 leading-relaxed">
                  Além disso, elevamos a web web app a um novo patamar com capacidades de <strong>Progressive Web App (PWA)</strong>, transformando a plataforma em uma experiência similar a um app nativo, essencial para a leitura imersiva do glossário e guia.
                </p>
              </div>

              <div>
                <h3 className="text-3xl md:text-4xl font-normal mb-6 leading-tight">Parsers de Markdown e Busca</h3>
                <p className="text-lg font-light text-gray-300 leading-relaxed">
                  A gestão de conteúdo em larga escala exigiu uma arquitetura inteligente. Estruturamos o sistema para processar arquivos via <code>markdown.ts</code> e organizar metadados com <code>mapping.ts</code>. Para navegação rápida, o hook <code>use-search.ts</code> foi otimizado para lidar com requisições em tempo real, integrando-se perfeitamente à interface de busca.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Resultados */}
      <section className="py-24 px-8 md:px-16 lg:px-24 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] border-b border-[#222] bg-[#111]">
        <div className="max-w-6xl grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono sticky top-24">04 / O Impacto</h2>
          </div>
          <div className="md:col-span-8">
            <h3 className="text-3xl md:text-5xl font-normal mb-8 leading-tight">Performance e Crescimento Mútuo</h3>
            <p className="text-lg font-light text-gray-300 leading-relaxed mb-6">
              A evolução do projeto não se resume a métricas (embora superamos gargalos significativos de bundle size e LCP), mas sim na sinergia da equipe. Aprender a escalar um projeto mantendo a barra de qualidade alta reforçou a importância da comunicação clara entre design e engenharia.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Equipe */}
      <section className="py-32 px-8 md:px-16 lg:px-24 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] bg-white text-black">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-sm tracking-widest uppercase opacity-50 font-mono mb-4">05 / Créditos</h2>
            <h3 className="text-5xl md:text-7xl font-medium tracking-tighter">As Pessoas</h3>
            <p className="mt-6 text-xl font-light opacity-80 max-w-2xl mx-auto">
              A tecnologia é apenas a ferramenta; o talento humano é o que constrói a visão.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {/* Template de Pessoa 1 */}
            <div className="group block cursor-pointer">
              <div className="aspect-[3/4] bg-gray-200 w-full mb-4 overflow-hidden relative">
                {/* Substitua por imagens reais */}
                <div className="absolute inset-0 bg-gray-300 transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"></div>
              </div>
              <h4 className="text-xl font-medium mb-1">Membro da Equipe</h4>
              <p className="text-sm opacity-60 font-mono uppercase">Engenharia / QA</p>
            </div>
            
            {/* Template de Pessoa 2 */}
            <div className="group block cursor-pointer">
              <div className="aspect-[3/4] bg-gray-200 w-full mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gray-300 transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"></div>
              </div>
              <h4 className="text-xl font-medium mb-1">Membro da Equipe</h4>
              <p className="text-sm opacity-60 font-mono uppercase">Design / UX</p>
            </div>

            {/* Template de Pessoa 3 */}
            <div className="group block cursor-pointer">
              <div className="aspect-[3/4] bg-gray-200 w-full mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gray-300 transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"></div>
              </div>
              <h4 className="text-xl font-medium mb-1">Membro da Equipe</h4>
              <p className="text-sm opacity-60 font-mono uppercase">Product Owner</p>
            </div>

            {/* Template de Pessoa 4 */}
            <div className="group block cursor-pointer">
              <div className="aspect-[3/4] bg-gray-200 w-full mb-4 overflow-hidden relative">
                <div className="absolute inset-0 bg-gray-300 transition-transform duration-700 group-hover:scale-105 mix-blend-multiply"></div>
              </div>
              <h4 className="text-xl font-medium mb-1">Membro da Equipe</h4>
              <p className="text-sm opacity-60 font-mono uppercase">Fullstack Dev</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Footer minimalista */}
      <footer className="py-12 px-8 md:px-16 lg:pl-[140px] 2xl:pl-[160px] 3xl:pl-[180px] text-center border-t border-gray-200 bg-white text-black">
        <p className="text-xs uppercase tracking-widest font-mono opacity-50">Base de Conhecimento © 2026</p>
      </footer>
    </div>
  );
}
