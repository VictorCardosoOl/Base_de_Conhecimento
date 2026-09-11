import React from 'react';

export const IntroducaoHero: React.FC = () => {
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
            <span className="text-[clamp(4.2rem,9.5vw,13rem)] block transform -translate-x-1 lg:-translate-x-2">
              Base de
            </span>
            <span className="text-[clamp(4.2rem,9.5vw,13rem)] block transform -translate-x-1 lg:-translate-x-2 mt-1 lg:mt-2">
              Conhecimento
            </span>
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
                <p className="text-xs sm:text-[13px] leading-relaxed text-text-muted font-sans font-normal">
                  Este espaço nasceu da necessidade diária de consolidar e democratizar o saber técnico de SST, eSocial e legislação trabalhista. Trata-se de uma versão pública e simplificada do ecossistema atualmente em produção e operação contínua dentro da nossa empresa.
                </p>
              </div>

              {/* BLOCO 2: Diagrama de Venn dos Três Pilares Integrados */}
              <div className="flex flex-col items-center w-full pt-2">
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
                    Idealizado e mantido colaborativamente pelo time corporativo — unindo especialistas técnicos em campo, engenharia de processos e tecnologia para criar respostas ágeis, confiáveis e humanas para todos os colaboradores.
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
