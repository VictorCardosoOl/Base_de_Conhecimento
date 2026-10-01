'use client';

import React, { useState, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { chapters, Chapter } from '../../data/sobre-chapters';

const SPRING_TRANSITION = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 40,
  mass: 0.8,
};

interface AccordionItemProps {
  chapter: Chapter;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  onHoverStart: (index: number) => void;
  onHoverEnd: () => void;
  onClick: (index: number) => void;
}

const MemoizedAccordionItem = memo(({
  chapter,
  index,
  isActive,
  isHovered,
  onHoverStart,
  onHoverEnd,
  onClick,
}: AccordionItemProps) => {
  const collapsedWidth = 'w-14 md:w-20 lg:w-24';
  const widthClass = isActive ? 'flex-1 min-w-0' : collapsedWidth;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(index);
    }
  };

  return (
    <motion.article
      layout
      key={chapter.id}
      initial={false}
      animate={{ x: isHovered && !isActive ? 16 : 0 }}
      transition={SPRING_TRANSITION}
      onMouseEnter={() => onHoverStart(index)}
      onMouseLeave={onHoverEnd}
      onClick={() => !isActive && onClick(index)}
      onKeyDown={handleKeyDown}
      role="tab"
      tabIndex={0}
      aria-selected={isActive}
      aria-controls={`panel-${chapter.id}`}
      id={`tab-${chapter.id}`}
      className={`
        relative h-full flex-shrink-0 flex flex-col focus:outline-none focus:ring-2 focus:ring-white/50
        cursor-pointer overflow-hidden border-r border-black/10 dark:border-white/5
        ${widthClass} ${chapter.bgClass}
        ${isActive ? 'cursor-default' : 'group hover:z-10'}
      `}
    >
      {/* Title for collapsed state */}
      <motion.div
        layout
        initial={false}
        animate={{
          opacity: isActive ? 0 : 1,
          scale: isActive ? 0.95 : 1,
          x: isHovered && !isActive ? 4 : 0,
          transitionEnd: { display: isActive ? 'none' : 'flex' },
        }}
        transition={SPRING_TRANSITION}
        className={`absolute inset-0 flex flex-col items-center justify-center ${isActive ? 'pointer-events-none' : ''}`}
      >
        <motion.span
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0.6 }}
          transition={{ duration: 0.2 }}
          className="whitespace-nowrap text-sm md:text-base uppercase tracking-[0.3em] font-mono z-10"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
          }}
        >
          {chapter.title}
        </motion.span>
      </motion.div>

      {/* Content for expanded state */}
      <motion.div
        layout
        id={`panel-${chapter.id}`}
        role="tabpanel"
        aria-labelledby={`tab-${chapter.id}`}
        initial={false}
        animate={{
          opacity: isActive ? 1 : 0,
          x: isActive ? 0 : 30,
          transitionEnd: { display: isActive ? 'block' : 'none' },
        }}
        transition={{
          ...SPRING_TRANSITION,
          delay: 0.05,
        }}
        className={`absolute inset-0 overflow-y-auto no-scrollbar ${isActive ? '' : 'pointer-events-none'}`}
        data-lenis-prevent
      >
        <div className="min-h-full h-full px-6 md:px-12 lg:px-20 xl:px-32 lg:pl-[120px] 2xl:pl-[160px] max-w-[2000px] mx-auto">
          {chapter.content}
        </div>
      </motion.div>
    </motion.article>
  );
});
MemoizedAccordionItem.displayName = 'MemoizedAccordionItem';

export function SobreAccordion() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const hoverColor = hoverIndex !== null ? chapters[hoverIndex].themeColor : 'transparent';

  const handleHoverStart = useCallback((index: number) => setHoverIndex(index), []);
  const handleHoverEnd = useCallback(() => setHoverIndex(null), []);
  const handleClick = useCallback((index: number) => setActiveIndex(index), []);

  return (
    <div 
      role="tablist"
      aria-label="Sobre o Projeto"
      className="flex w-full h-[100dvh] overflow-hidden selection:bg-black selection:text-white transition-colors duration-300"
      style={{ backgroundColor: hoverColor }}
    >
      {chapters.map((chapter, index) => (
        <MemoizedAccordionItem
          key={chapter.id}
          chapter={chapter}
          index={index}
          isActive={index === activeIndex}
          isHovered={index === hoverIndex}
          onHoverStart={handleHoverStart}
          onHoverEnd={handleHoverEnd}
          onClick={handleClick}
        />
      ))}
    </div>
  );
}

