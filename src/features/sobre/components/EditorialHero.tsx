import React from 'react';

export const EditorialHero = () => {
  return (
    <section className="min-h-[85vh] flex flex-col justify-center items-center text-center px-6 md:px-12 relative overflow-hidden">
      {/* Background Image (Moody Landscape) with Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-50 mix-blend-multiply saturate-50 contrast-125"
        style={{
          backgroundImage: "url('/sobre-hero-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      
      {/* Subtle vignette for depth */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-transparent via-transparent to-[#EBE9E1]"></div>

      <div className="max-w-4xl mx-auto flex flex-col items-center justify-center z-10 pt-24">
        <h1 className="font-serif text-7xl md:text-9xl lg:text-[10rem] tracking-tighter text-[#1a1a1a] mb-6 leading-[0.8] drop-shadow-sm">
          SST<span className="italic">FAQ</span>
        </h1>
        <p className="font-mono uppercase tracking-[0.3em] text-[10px] md:text-xs opacity-80 mb-6 border-b border-black/20 pb-4 w-48 text-[#1a1a1a] font-medium">
          ESTD 2026
        </p>
        <p className="font-serif italic text-xl md:text-2xl text-[#1a1a1a] opacity-90 max-w-lg mx-auto leading-relaxed mt-4">
          Base de Conhecimento Operacional
        </p>
      </div>
    </section>
  );
};
