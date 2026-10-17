'use client';

import React, { useRef } from 'react';
import Image from 'next/image';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { team, TeamMember } from '@/data/sobre-chapters';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const initials = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

/** Moldura de foto minimalista, elegante e editorial */
const PhotoFrame = ({
  member,
  aspect = 'aspect-[4/5]',
  className = '',
}: {
  member: TeamMember;
  aspect?: string;
  className?: string;
}) => (
  <div
    className={`relative ${aspect} overflow-hidden bg-[#dedad0] border border-black/10 transition-colors duration-500 group-hover:border-black/30 ${className}`}
    aria-label={member.photo ? undefined : `Foto de ${member.name}`}
  >
    {member.photo ? (
      <Image
        src={member.photo}
        alt={member.name}
        fill
        sizes="(max-width: 768px) 100vw, 320px"
        className="object-cover grayscale contrast-[1.08] transition-all duration-700 ease-out group-hover:grayscale-0 group-hover:scale-105"
      />
    ) : (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-[#e2ded5]/80 group-hover:bg-[#e2ded5] transition-colors duration-500">
        <span className="font-serif text-3xl sm:text-4xl text-[#1a1a1a]/25 tracking-wider select-none mb-1 font-light group-hover:text-[#1a1a1a]/40 group-hover:scale-105 transition-all duration-500">
          {initials(member.name)}
        </span>
        <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-[#1a1a1a]/30">
          Foto em breve
        </span>
      </div>
    )}

    {/* Vinheta sutil de filme/papel fotográfico */}
    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/15 via-transparent to-transparent opacity-60" />
  </div>
);

/** Card individual de participante */
const MemberCard = ({
  member,
  featured = false,
}: {
  member: TeamMember;
  featured?: boolean;
}) => (
  <article className="team-card group flex flex-col">
    <PhotoFrame
      member={member}
      aspect={featured ? 'aspect-[4/5]' : 'aspect-square'}
      className="w-full mb-5"
    />

    <div className="flex flex-col">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]/40 group-hover:bg-[#1a1a1a] transition-colors duration-300" />
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-[#1a1a1a]/60 font-medium">
          {member.role}
        </span>
      </div>

      <h4 className="font-serif text-xl sm:text-2xl text-[#1a1a1a] leading-tight tracking-tight mb-3 group-hover:opacity-80 transition-opacity">
        {member.name}
      </h4>

      <p className="font-serif text-sm sm:text-[15px] leading-[1.7] text-[#1a1a1a]/80 text-justify md:text-left">
        {member.bio}
      </p>
    </div>
  </article>
);

export const IdealizadoresSection = ({ number = '07' }: { number?: string }) => {
  const sectionRef = useRef<HTMLElement>(null);
  const progressLineRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentColRef = useRef<HTMLDivElement>(null);

  const founders = team.filter((m) => m.group === 'idealizador');
  const consultants = team.filter((m) => m.group === 'consultor');

  useGSAP(
    () => {
      if (!sectionRef.current) return;

      // Linha de progresso no topo (idêntica aos capítulos 01..06)
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

      // Sticky header suave
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

      // Revelação em cascata dos elementos
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
      id="idealizadores"
      className="relative pt-20 pb-20 px-6 md:px-12 w-full max-w-6xl mx-auto"
    >
      {/* Top divider com linha de progresso animada (consistente com o design system) */}
      <div className="relative w-full h-[1px] bg-black/10 mb-14 overflow-hidden">
        <div
          ref={progressLineRef}
          className="absolute inset-0 bg-[#1a1a1a] origin-left"
          style={{ transform: 'scaleX(0)' }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
        {/* Coluna da esquerda: Sticky Editorial Header idêntica aos capítulos 01..06 */}
        <div
          ref={headerRef}
          className="lg:col-span-4 lg:sticky lg:top-24 flex flex-col pt-1"
        >
          <div className="flex items-center gap-3 mb-5">
            <span className="font-mono text-[11px] tracking-[0.25em] text-[#1a1a1a] font-semibold bg-black/5 px-2.5 py-1 rounded">
              CAP. {number}
            </span>
            <span className="font-mono text-[10px] tracking-widest text-[#1a1a1a]/40 uppercase">
              / 07
            </span>
          </div>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#1a1a1a] leading-[1.08] tracking-tight mb-4">
            Idealizadores &amp; Equipe
          </h2>

          <p className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase text-[#1a1a1a]/60 leading-relaxed border-t border-black/10 pt-4 mt-2">
            Concepção, Engenharia e Consultoria Especializada
          </p>

          <div className="hidden lg:flex items-center gap-2 mt-8 opacity-30 text-[9px] font-mono tracking-widest uppercase">
            <span>QUEM FAZ ACONTECER</span>
            <span className="w-10 h-[1px] bg-black" />
          </div>
        </div>

        {/* Coluna da direita: Composição Editorial com Parágrafo Manifesto + Dupla de Fotos + Grid de Cards */}
        <div
          ref={contentColRef}
          className="lg:col-span-8 flex flex-col font-sans text-[#1a1a1a]"
        >
          {/* 1. Manifesto de Abertura */}
          <div className="editorial-block mb-10">
            <p className="text-base sm:text-lg font-serif leading-[1.8] text-[#1a1a1a]/85 text-justify md:text-left">
              A Base de Conhecimento é fruto da união entre visão de produto, design e engenharia
              de software conduzida por <strong className="font-semibold text-[#1a1a1a]">Victor Cardoso</strong> e{' '}
              <strong className="font-semibold text-[#1a1a1a]">Guilherme Cruz</strong>. O objetivo central é
              transformar a complexidade normativa de SST e eSocial em clareza operacional diária. Para
              assegurar o mais alto rigor técnico, contamos com o suporte consultivo direto de{' '}
              <span className="text-[#1a1a1a] font-medium">Aron Nascimento</span>,{' '}
              <span className="text-[#1a1a1a] font-medium">Sabrina</span> e{' '}
              <span className="text-[#1a1a1a] font-medium">João</span>, trazendo o conhecimento vivo
              de quem atua diariamente no suporte e na consultoria técnica.
            </p>
          </div>

          {/* 2. Seção de Idealizadores (Cards estruturados) */}
          <div className="editorial-block pt-6 border-t border-black/10">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1a1a1a] font-semibold">
                Idealizadores
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#1a1a1a]/40">
                0{founders.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 md:gap-10">
              {founders.map((member) => (
                <MemberCard key={member.id} member={member} featured />
              ))}
            </div>
          </div>

          {/* 3. Seção de Consultores (Cards refinados) */}
          <div className="editorial-block mt-14 pt-8 border-t border-black/10">
            <div className="flex items-center justify-between mb-8">
              <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#1a1a1a] font-semibold">
                Consultoria Especializada
              </span>
              <span className="font-mono text-[10px] tracking-widest text-[#1a1a1a]/40">
                0{consultants.length}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 md:gap-8">
              {consultants.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
