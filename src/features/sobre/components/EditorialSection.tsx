'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { EditorialChapter } from '@/data/sobre-chapters';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface EditorialSectionProps {
  chapter: EditorialChapter;
  index: number;
  total: number;
}

export const EditorialSection = ({ chapter, index, total }: EditorialSectionProps) => {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const contentColRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // 1. Barra fina de progresso editorial no topo da seção (preenche com scrub elegante)
      if (progressLineRef.current) {
        gsap.fromTo(
          progressLineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 85%',
              end: 'top 25%',
              scrub: 0.6,
            },
          }
        );
      }

      // 2. Animação de entrada suave no cabeçalho sticky
      if (headerRef.current) {
        gsap.fromTo(
          headerRef.current,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          }
        );
      }

      // 3. Stagger nos blocos de texto/colunas
      if (contentColRef.current) {
        const blocks = contentColRef.current.querySelectorAll('.editorial-block');
        if (blocks.length > 0) {
          gsap.fromTo(
            blocks,
            { opacity: 0, y: 25 },
            {
              opacity: 1,
              y: 0,
              duration: 0.8,
              stagger: 0.12,
              ease: 'power3.out',
              scrollTrigger: {
                trigger: contentColRef.current,
                start: 'top 82%',
                toggleActions: 'play none none reverse',
              },
            }
          );
        }
      }
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      id={chapter.id}
      className="relative pt-20 pb-16 px-6 md:px-12 w-full max-w-6xl mx-auto"
    >
      {/* Top divider com linha de progresso animada */}
      <div className="relative w-full h-[1px] bg-black/10 mb-14 overflow-hidden">
        <div
          ref={progressLineRef}
          className="absolute inset-0 bg-[#1a1a1a] origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Coluna da esquerda: Sticky Editorial Header com Tipografia Refinada */}
        <div
          ref={headerRef}
          className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col pt-1"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[11px] tracking-[0.25em] text-[#1a1a1a] font-semibold bg-black/5 px-2.5 py-1 rounded">
              CAP. {chapter.number}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-[#1a1a1a]/40 uppercase">
              / 0{total}
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1a1a1a] leading-[1.08] tracking-tight mb-4">
            {chapter.title}
          </h2>

          {chapter.subtitle && (
            <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/60 leading-relaxed border-t border-black/10 pt-4 mt-2">
              {chapter.subtitle}
            </p>
          )}

          {/* Decoração editorial inspirada em jornais & periódicos de design */}
          <div className="hidden lg:flex items-center gap-2 mt-8 opacity-30 text-[9px] font-mono tracking-widest uppercase">
            <span>COLUNA EDITORIAL</span>
            <span className="w-10 h-[1px] bg-black" />
          </div>
        </div>

        {/* Coluna da direita: Textos com Layout Editorial em Colunas (Estilo Revista/Newspaper) */}
        <div
          ref={contentColRef}
          className="lg:col-span-8 flex flex-col font-sans text-[#1a1a1a]"
        >
          {/* Se o conteúdo tiver múltiplos parágrafos simples de texto, exibe em layout de 2 colunas elegantes */}
          {chapter.content.every((item) => typeof item === 'string') ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
              {chapter.content.map((paragraph, idx) => (
                <div key={`${chapter.id}-col-${idx}`} className="editorial-block">
                  <p className="text-base sm:text-[17px] font-serif leading-[1.75] text-[#1a1a1a]/85 text-justify md:text-left selection:bg-[#1a1a1a] selection:text-[#EBE9E1]">
                    {paragraph}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            /* Caso contenha cards (como nos idealizadores/permissões), mantém blocos com espaçamento refinado */
            <div className="space-y-8">
              {chapter.content.map((item, idx) => (
                <div key={`${chapter.id}-item-${idx}`} className="editorial-block leading-relaxed">
                  {typeof item === 'string' ? (
                    <p className="text-base sm:text-[17px] font-serif leading-[1.75] text-[#1a1a1a]/85">
                      {item}
                    </p>
                  ) : (
                    <div>{item}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {chapter.callout && (
            <div className="editorial-block mt-12 pt-8 border-t border-black/10">
              {chapter.callout}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
