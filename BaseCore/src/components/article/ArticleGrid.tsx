'use client';
import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpRight, Plus, Check } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { FAQItem } from '@/types/index';
import { useReadingQueue } from '@/hooks/use-reading-queue';

import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface CardItemProps {
  item: FAQItem;
  onClick: () => void;
  isInQueue: boolean;
  onToggleQueue: (e?: React.MouseEvent) => void;
}

const CardItem: React.FC<CardItemProps & { index?: number }> = ({
  item,
  onClick,
  isInQueue,
  onToggleQueue,
  index = 0,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const exploreRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (cardRef.current) {
      gsap.fromTo(cardRef.current,
        { opacity: 0, y: 18 },
        { 
          opacity: 1, 
          y: 0, 
          duration: 0.38, 
          delay: Math.min(0.18, index * 0.022),
          ease: 'power4.out' 
        }
      );
    }
  }, []);

  const handleMouseEnter = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
    if (exploreRef.current) {
      gsap.to(exploreRef.current, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
    if (arrowRef.current) {
      gsap.to(arrowRef.current, { x: 0, y: 0, duration: 0.3, ease: 'back.out(1.7)', delay: 0.05 });
    }
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
    if (exploreRef.current) {
      gsap.to(exploreRef.current, { opacity: 0, y: 6, duration: 0.2, ease: 'power2.in' });
    }
    if (arrowRef.current) {
      gsap.to(arrowRef.current, { x: -4, y: 4, duration: 0.2, ease: 'power2.in' });
    }
  };

  const handleMouseDown = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { scale: 0.985, duration: 0.1, ease: 'power1.inOut' });
    }
  };

  const handleMouseUp = () => {
    if (cardRef.current) {
      gsap.to(cardRef.current, { scale: 1, duration: 0.3, ease: 'power2.out' });
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={onClick}
      className="group cursor-pointer relative py-6 border-b border-border flex flex-col justify-between h-full transform-gpu transition-colors duration-300"
    >
      {/* Indicador Lateral */}
      <div className="absolute left-0 top-8 bottom-8 w-[1.5px] bg-text-main scale-y-0 lg:group-hover:scale-y-100 transition-transform duration-[400ms] ease-[cubic-bezier(0.25,1,0.5,1)] origin-top z-10 transform-gpu" />

      {/* Container interno */}
      <div className="space-y-3 w-full transform-gpu pl-5">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted transition-colors duration-300 lg:group-hover:text-text-main">
                {item.category}
              </span>
              <div className="w-5 h-[0.5px] bg-border transition-colors duration-300 lg:group-hover:bg-text-main/50" />
              <span className="text-[10px] font-medium text-text-muted tracking-widest">
                {item.date}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleQueue(e);
              }}
              aria-label={
                isInQueue
                  ? 'Remover da lista de leitura'
                  : 'Salvar na lista de leitura'
              }
              className={`p-1.5 rounded-full transition-all duration-[300ms] ease-out z-20 hover:scale-110 active:scale-90 ${
                isInQueue
                  ? 'text-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/30'
                  : 'text-text-muted hover:text-text-main hover:bg-bg-island dark:hover:bg-white/5 opacity-0 group-hover:opacity-100'
              }`}
            >
              {isInQueue ? <Check size={16} /> : <Plus size={16} />}
            </button>
          </div>

          <div className="w-full space-y-2 bg-transparent overflow-hidden">
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-serif font-light leading-tight text-text-main transition-colors duration-300">
              {item.question}
            </h3>
            <p className="text-text-muted font-light leading-relaxed line-clamp-2 transition-colors duration-300 lg:group-hover:text-text-main text-base sm:text-lg">
              {item.answer}
            </p>
          </div>

          {/* Botão explorar animado */}
          <div
            ref={exploreRef}
            className="flex items-center gap-2.5 text-[9px] font-black uppercase tracking-[0.15em] text-text-main transform-gpu pt-1 opacity-0 translate-y-1.5"
            aria-hidden="true"
          >
            Explorar Diretriz
            <div ref={arrowRef} className="-translate-x-1 translate-y-1">
              <ArrowUpRight size={14} strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ArticleGrid = ({
  items,
  onModalStateChange,
}: {
  items: FAQItem[];
  onModalStateChange?: (isOpen: boolean) => void;
}) => {
  const { queue, toggleQueue } = useReadingQueue();
  const router = useRouter();

  const handleSetSelected = (item: FAQItem) => {
    onModalStateChange?.(true);
    router.push(`/artigo/${item.id}`, { scroll: false });
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 3xl:grid-cols-3 gap-x-8 lg:gap-x-12 2xl:gap-x-16 3xl:gap-x-20 gap-y-4 2xl:gap-y-6">
        {items.map((item, idx) => (
          <CardItem
            key={item.id}
            item={item}
            index={idx}
            onClick={() => handleSetSelected(item)}
            isInQueue={queue.includes(item.id)}
            onToggleQueue={() => toggleQueue(item.id)}
          />
        ))}
      </div>
    </div>
  );
};
