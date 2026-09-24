"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { heroLineVariants } from '@/lib/animations';

export const IntroHero: React.FC = () => {
  return (
    <div className="w-full relative select-none">
      {/* Container Principal:
          Divide a tela em 2 metades (Esquerda e Direita).
          A metade Direita é dividida em 2 (Superior com a caixa de texto/scroll e Inferior vazia/livre).
      */}
      <div className="relative w-full min-h-[520px] lg:h-[72vh] lg:max-h-[680px] 2xl:max-h-[800px] 3xl:max-h-[900px] grid grid-cols-1 lg:grid-cols-12 items-start overflow-visible pt-2 2xl:pt-6">
        
        {/* PARTE 1 (METADE ESQUERDA - 7 ou 8 cols):
            PALAVRAS GIGANTES FIXAS VINCULADAS AO PROJETO
            "Base de" e "Conhecimento" com tipografia monumental impactante,
            posicionada em direção ao footer (justify-end pb-8) e sem nenhum corte.
        */}
        <div className="lg:col-span-8 h-full flex flex-col justify-end pb-6 lg:pb-10 2xl:pb-14 pointer-events-none select-none z-10 overflow-visible">
          <h1 className="flex flex-col tracking-[-0.045em] font-serif font-normal leading-[0.76] text-text-main overflow-visible">
            <motion.span 
              initial={{ opacity: 0, y: 90, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(4.2rem,9.5vw,13rem)] block transform -translate-x-1 lg:-translate-x-2 will-change-transform"
            >
              Base de
            </motion.span>
            <motion.span 
              initial={{ opacity: 0, y: 90, rotate: 1.5 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.7, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="text-[clamp(4.2rem,9.5vw,13rem)] block transform -translate-x-1 lg:-translate-x-2 mt-1 lg:mt-2 will-change-transform"
            >
              Conhecimento
            </motion.span>
          </h1>
        </div>

        {/* PARTE 2 (METADE DIREITA - 4 ou 5 cols):
            Dividida em duas sub-partes verticais:
            - Superior: Caixa de texto compacta isolada com scroll próprio
            - Inferior: Área totalmente livre/vazia (conforme o esboço de paint)
        */}
        <div className="lg:col-span-4 h-full flex flex-col justify-between items-end z-20">
          
          {/* SUB-PARTE SUPERIOR (Quadrante Superior Direito):
              Apenas esta caixinha possui scroll vertical interno.
              Conta a origem do projeto e as pessoas que o criaram.
          */}
          <div className="w-full max-w-xs sm:max-w-sm 2xl:max-w-md flex flex-col items-end">
            <div
              data-lenis-prevent
              className="w-full max-h-[220px] lg:max-h-[240px] 2xl:max-h-[300px] overflow-y-auto overscroll-contain pr-4 pl-2 space-y-8 no-scrollbar select-text border-l border-transparent hover:border-border/30 transition-colors"
            >
              {/* BLOCO 1: A Origem e Propósito */}
              <div className="space-y-3 pt-1">
                <h2 className="text-[13px] font-bold tracking-tight text-text-main font-sans">
                  A Origem da Base de Conhecimento
                </h2>
                <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-text-muted font-sans font-normal">
                  <p>
                    A Base de Conhecimento nasceu de uma necessidade real de estruturação operacional. Durante os meus primeiros meses na empresa, notei que, por se tratar de uma software house em franco crescimento, grande parte da cultura e dos processos era transmitida exclusivamente de forma oral. Com a rotatividade natural da equipa, surgiam ruídos de comunicação que desconectavam algumas práticas da realidade da operação.
                  </p>
                  <p>
                    Identificando esta oportunidade de otimização, idealizei o projeto. A ausência de documentação criava barreiras para os novos colaboradores, o que se refletia diretamente no tempo de resposta ao cliente, impactando os nossos SLAs de atendimento e gerando uma margem de erro significativa nos suportes prestados.
                  </p>
                  <p>
                    Tomei a iniciativa de começar a documentar os processos em ficheiros de texto, criando fluxogramas e estabelecendo com clareza o papel de cada membro da equipa. Esta proatividade impulsionou a minha transição para Analista de Suporte N2 e, posteriormente, assumi a liderança da equipa de formação. Com a responsabilidade de dar formação a clientes e colaboradores, transformei a criação de documentação numa dinâmica de aprendizagem: envolvi a equipa interna na elaboração de pequenos resumos e scripts de atendimento.
                  </p>
                  <p>
                    O volume de informação gerado consolidou a ideia de criar um portal centralizado. O objetivo deste site é claro: ajudar a equipa a encontrar soluções rápidas, reduzindo erros, diminuindo o nosso tempo de SLA e facilitando a integração, o que ajudou a diminuir drasticamente o turnover.
                  </p>
                </div>
              </div>

              {/* BLOCO 2: A Arquitetura Tecnológica */}
              <div className="space-y-3 pt-4">
                <h2 className="text-[13px] font-bold tracking-tight text-text-main font-sans">
                  A Arquitetura Tecnológica
                </h2>
                <div className="space-y-4 text-xs sm:text-[13px] leading-relaxed text-text-muted font-sans font-normal">
                  <p>
                    Fui o responsável por desenhar a arquitetura técnica do projeto, procurando uma solução que fosse extremamente performática e que não dependesse de bases de dados complexas ou custos mensais de infraestrutura. Para isso, adotei Next.js (App Router) com TypeScript e Tailwind CSS, fundamentando a aplicação no conceito de Git-based CMS (Content as Code).
                  </p>
                  <p>
                    A logística de inclusão de conteúdo e a organização do projeto foram estruturadas num pipeline automatizado de conversão que chamo de Markdown-to-JSON:
                  </p>
                  <ul className="space-y-3 pl-3 border-l border-border/60">
                    <li>
                      <strong className="text-text-main font-semibold">Repositório Centralizado:</strong> O conteúdo não fica escondido num painel; ele vive no código. Os artigos são redigidos em formato Markdown (.md) e armazenados na árvore de diretórios em <code className="bg-bg-island px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50">src/content/artigos/</code>, separados em subdiretórios modulares por domínio técnico (como eSocial, GRO, TI, Financeiro).
                    </li>
                    <li>
                      <strong className="text-text-main font-semibold">Metadata e Frontmatter:</strong> Cada ficheiro Markdown recebe metadados estruturados no topo do documento (como id, question e tags). Isto permite que os próprios membros da equipa redijam os artigos usando editores simples, passando por revisão e versionamento via Git (Pull Requests), garantindo total controlo de versão sobre a documentação.
                    </li>
                    <li>
                      <strong className="text-text-main font-semibold">Pipeline de Build Automation:</strong> Desenvolvi um script local em Node.js (<code className="bg-bg-island px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50">scripts/generate-catalog.js</code>) que é acionado no estágio de prebuild da aplicação. Ele varre recursivamente toda a pasta de artigos, converte e condensa as informações, gerando dois artefatos: um índice consolidado (<code className="bg-bg-island px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50">catalog.json</code>) e um mapeamento assíncrono de dependências (<code className="bg-bg-island px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50">mapping.ts</code>).
                    </li>
                    <li>
                      <strong className="text-text-main font-semibold">Static Site Generation (SSG):</strong> O framework (Next.js) consome o catálogo gerado para executar a função <code className="bg-bg-island px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50">generateStaticParams</code>, pré-renderizando as rotas dinâmicas (<code className="bg-bg-island px-1.5 py-0.5 rounded text-[11px] font-mono border border-border/50">/artigo/[id]</code>) do lado do servidor em tempo de build.
                    </li>
                  </ul>
                  <p>
                    O resultado desta arquitetura é uma aplicação de latência quase nula, com carregamento imediato, já que o utilizador consome HTML estático altamente cacheado por CDNs.
                  </p>
                </div>
              </div>

              {/* BLOCO 3: Diagrama de Venn dos Três Pilares Integrados */}
              <div className="flex flex-col items-center w-full pt-6">
                <div className="w-48 h-40 relative mb-4">
                  <svg viewBox="0 0 220 200" className="w-full h-full overflow-visible">
                    {/* Círculo 1: Operação SST */}
                    <circle
                      cx="80"
                      cy="65"
                      r="50"
                      fill="none"
                      stroke="#db2777"
                      strokeWidth="1.2"
                      strokeDasharray="3.5 3.5"
                      className="opacity-90"
                    />
                    {/* Círculo 2: Tecnologia & Dev */}
                    <circle
                      cx="140"
                      cy="65"
                      r="50"
                      fill="none"
                      stroke="#db2777"
                      strokeWidth="1.2"
                      strokeDasharray="3.5 3.5"
                      className="opacity-90"
                    />
                    {/* Círculo 3: Pessoas & Cultura */}
                    <circle
                      cx="110"
                      cy="120"
                      r="50"
                      fill="none"
                      stroke="#db2777"
                      strokeWidth="1.2"
                      strokeDasharray="3.5 3.5"
                      className="opacity-90"
                    />

                    {/* Rótulos dos Círculos */}
                    <text x="80" y="60" textAnchor="middle" fill="currentColor" className="text-[9.5px] font-sans font-bold fill-text-main">
                      Operação
                    </text>
                    <text x="80" y="73" textAnchor="middle" fill="currentColor" className="text-[8px] font-sans font-normal fill-text-muted">
                      (SST / eSocial)
                    </text>

                    <text x="140" y="60" textAnchor="middle" fill="currentColor" className="text-[9.5px] font-sans font-bold fill-text-main">
                      Tecnologia
                    </text>
                    <text x="140" y="73" textAnchor="middle" fill="currentColor" className="text-[8px] font-sans font-normal fill-text-muted">
                      (automação & dev)
                    </text>

                    <text x="110" y="118" textAnchor="middle" fill="currentColor" className="text-[9.5px] font-sans font-bold fill-text-main">
                      Pessoas
                    </text>
                    <text x="110" y="131" textAnchor="middle" fill="currentColor" className="text-[8px] font-sans font-normal fill-text-muted">
                      (compartilhamento)
                    </text>
                  </svg>
                </div>

                {/* Texto explicativo sobre quem construiu e o time */}
                <div className="space-y-2 w-full">
                  <p className="text-xs sm:text-[13px] leading-relaxed text-text-muted font-sans font-normal">
                    Para que esta visão se tornasse realidade e para garantir a excelência em termos de Design e UX que implementei, contei com a parceria essencial de dois grandes membros da equipa: Guilherme Cruz (@https-shini), que auxiliou profundamente no desenvolvimento e na estruturação do código da aplicação, e João Sanches (@Juao-crtl-c), que atuou brilhantemente na revisão minuciosa e curadoria dos textos antes da minha integração e aprovação final.
                  </p>
                </div>
              </div>

              {/* Fim do Scroll com espaçamento limpo */}
              <div className="h-6" />
            </div>
          </div>

          {/* SUB-PARTE INFERIOR:
              Espaço deliberadamente vazio / limpo, garantindo que o texto nunca desça
              até a altura de 'conhecimento', preservando o quadrante superior.
          */}
          <div className="w-full flex-1 min-h-[160px] pointer-events-none" />

        </div>

      </div>
    </div>
  );
};
