import React from 'react';
import { EditorialHero } from '@/features/sobre/components/EditorialHero';
import { EditorialSection } from '@/features/sobre/components/EditorialSection';
import { chapters } from '@/data/sobre-chapters';
import { IdealizadoresSection } from '@/features/sobre/components/IdealizadoresSection';

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
      
      <div className="pb-0">
        {chapters.map((chapter, index) => (
          <EditorialSection
            key={chapter.id}
            chapter={chapter}
            index={index}
            total={chapters.length}
          />
        ))}
        <IdealizadoresSection number={String(chapters.length + 1).padStart(2, '0')} />
      </div>
    </main>
  );
}
