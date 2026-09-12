import React from 'react';
import { motion } from 'framer-motion';

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
  const words = children.split(' ');

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.045,
        delayChildren: delay
      }
    }
  };

  const wordVariants = {
    hidden: {
      y: '108%',
      opacity: 0,
      rotateX: 18,
      clipPath: 'polygon(0 0, 100% 0, 100% 0, 0 0)'
    },
    visible: {
      y: '0%',
      opacity: 1,
      rotateX: 0,
      clipPath: 'polygon(0 -10%, 100% -10%, 100% 120%, 0 120%)',
      transition: {
        duration: 0.68,
        ease: [0.16, 1, 0.3, 1] // Curva Bezier de aceleração inicial rápida e amortecimento longo
      }
    }
  };

  return (
    <Component className={`inline-block overflow-hidden ${className}`}>
      <motion.span
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="inline-flex flex-wrap gap-x-[0.28em] will-change-transform"
      >
        {words.map((word, idx) => (
          <span key={idx} className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em]">
            <motion.span
              variants={wordVariants}
              className="inline-block will-change-transform transform-gpu origin-bottom"
            >
              {word}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Component>
  );
};
