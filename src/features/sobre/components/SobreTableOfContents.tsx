'use client';

import React from 'react';
import { chapters } from '@/data/sobre-chapters';

export const SobreTableOfContents = () => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-24 px-6 md:px-12 max-w-4xl mx-auto w-full">
      <div className="flex flex-col md:flex-row gap-8 md:gap-24 items-baseline border-b border-black/10 pb-4 mb-4">
        <span className="font-mono text-xs tracking-widest uppercase w-12 opacity-60">00.0</span>
        <span className="font-mono text-xs tracking-widest uppercase opacity-60">CONTENTS</span>
      </div>

      <div className="flex flex-col md:flex-row mt-12 gap-8 md:gap-24">
        <div className="font-serif text-3xl md:text-4xl w-full md:w-1/3 text-[#1a1a1a]">
          The Making Of
        </div>
        
        <div className="w-full md:w-2/3 flex flex-col">
          {chapters.map((chapter, i) => (
            <div 
              key={chapter.id} 
              className="group cursor-pointer border-b border-black/10 last:border-0 py-4 flex items-center justify-between hover:bg-black/5 transition-colors duration-300 px-2 -mx-2"
              onClick={() => scrollToSection(chapter.id)}
            >
              <div className="flex items-center gap-6">
                <span className="font-mono text-xs tracking-widest opacity-40">{chapter.number}</span>
                <span className="font-mono text-xs tracking-widest uppercase">{chapter.title}</span>
              </div>
              <span className="font-mono text-xs tracking-widest opacity-40">0{i + 1}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
