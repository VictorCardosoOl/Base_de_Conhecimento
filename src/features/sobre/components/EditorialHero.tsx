'use client';

import React, { useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const EditorialHero = () => {
  const containerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const tagRef = useRef<HTMLParagraphElement>(null);

  useGSAP(
    () => {
      if (!containerRef.current) return;

      // Timeline de entrada com stagger suave e elegante
      const tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

      tl.fromTo(
        bgRef.current,
        { scale: 1.15, opacity: 0 },
        { scale: 1, opacity: 0.45, duration: 2 }
      )
        .fromTo(
          titleRef.current,
          { y: 60, opacity: 0, letterSpacing: '-0.05em' },
          { y: 0, opacity: 1, letterSpacing: '-0.02em', duration: 1.4 },
          '-=1.5'
        )
        .fromTo(
          tagRef.current,
          { scaleX: 0, opacity: 0 },
          { scaleX: 1, opacity: 0.8, duration: 0.8 },
          '-=0.8'
        )
        .fromTo(
          subtitleRef.current,
          { y: 25, opacity: 0 },
          { y: 0, opacity: 0.9, duration: 1 },
          '-=0.6'
        );

      // Parallax sutil no scroll do Hero
      if (titleRef.current && bgRef.current) {
        gsap.to(titleRef.current, {
          y: -80,
          opacity: 0.3,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });

        gsap.to(bgRef.current, {
          y: 60,
          ease: 'none',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    },
    { scope: containerRef }
  );

  return (
    <section
      ref={containerRef}
      className="min-h-[85vh] flex flex-col justify-center items-center text-center px-6 md:px-12 relative overflow-hidden"
    >
      {/* Background Image (Moody Landscape) with Parallax */}
      <div
        ref={bgRef}
        className="absolute inset-0 z-0 opacity-40 mix-blend-multiply saturate-50 contrast-125 will-change-transform"
        style={{
          backgroundImage: "url('/sobre-hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-[#EBE9E1]" />

      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center z-10 pt-24 will-change-transform">
        <h1
          ref={titleRef}
          className="font-serif text-7xl md:text-9xl lg:text-[10rem] tracking-tighter text-[#1a1a1a] mb-6 leading-[0.8] drop-shadow-sm select-none"
        >
          SST<span className="italic font-normal">FAQ</span>
        </h1>
        <p
          ref={tagRef}
          className="font-mono uppercase tracking-[0.3em] text-[10px] md:text-xs opacity-80 mb-6 border-b border-black/20 pb-4 w-48 text-[#1a1a1a] font-medium origin-center"
        >
          ESTD 2026
        </p>
        <p
          ref={subtitleRef}
          className="font-serif italic text-xl md:text-2xl text-[#1a1a1a] opacity-90 max-w-lg mx-auto leading-relaxed mt-4"
        >
          Base de Conhecimento Operacional
        </p>
      </div>
    </section>
  );
};
