import React, { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

interface KineticTextProps {
  children: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  delay?: number;
}

export const KineticText: React.FC<KineticTextProps> = ({
  children,
  className = '',
  as: Component = 'span',
  delay = 0
}) => {
  const containerRef = useRef<HTMLElement>(null);
  const words = children.split(' ');

  useGSAP(() => {
    if (!containerRef.current) return;
    const wordElements = containerRef.current.querySelectorAll('.word-inner');
    
    gsap.fromTo(wordElements, 
      { 
        yPercent: 100,
        opacity: 0,
        rotateX: 18
      },
      {
        yPercent: 0,
        opacity: 1,
        rotateX: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.05,
        delay: delay,
        clearProps: "all" // Remove inline styles after animation for VRAM cleanup
      }
    );
  }, { scope: containerRef, dependencies: [children, delay] });

  return (
    <Component ref={containerRef} className={`inline-block ${className}`}>
      <span className="inline-flex flex-wrap gap-x-[0.28em]">
        {words.map((word, idx) => (
          <span 
            key={idx} 
            className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)' }}
          >
            <span className="word-inner inline-block will-change-transform transform-gpu origin-bottom">
              {word}
            </span>
          </span>
        ))}
      </span>
    </Component>
  );
};
