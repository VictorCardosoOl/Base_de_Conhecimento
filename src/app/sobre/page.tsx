import React from 'react';
import { EditorialHero } from '@/features/sobre/components/EditorialHero';
import { TableOfContents } from '@/features/sobre/components/TableOfContents';
import { EditorialSection } from '@/features/sobre/components/EditorialSection';
import { chapters } from '@/data/sobre-chapters';

export const metadata = {
  title: 'Sobre o Projeto | Estudo de Caso',
  description: 'Arquitetura, Design e Engenharia por trás da Base de Conhecimento.',
};

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-[#EBE9E1] text-[#1a1a1a] relative font-sans selection:bg-[#1a1a1a] selection:text-[#EBE9E1]">
      {/* Global Grain/Noise Overlay */}
      <div 
        className="fixed inset-0 w-full h-full pointer-events-none opacity-[0.04] mix-blend-overlay z-50"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      ></div>

      <EditorialHero />
      <TableOfContents />
      
      <div className="pb-32">
        {chapters.map((chapter) => (
          <EditorialSection key={chapter.id} chapter={chapter} />
        ))}
      </div>
      
      {/* Subtle Footer for the Editorial Page */}
      <footer className="py-12 border-t border-black/10 max-w-5xl mx-auto px-6 md:px-12 flex justify-between items-center opacity-60">
        <span className="font-mono text-[10px] tracking-widest uppercase">Dora Lazarevic ©2026</span>
        <span className="font-mono text-[10px] tracking-widest uppercase">She'll Be Waiting</span>
      </footer>
    </main>
  );
}
