import React, { useRef } from 'react';
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
  as = 'span',
  delay = 0
}) => {
  const words = children.split(' ');

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: delay,
      }
    }
  };

  const wordVariants = {
    hidden: {
      y: "100%",
      opacity: 0,
      rotateX: 18
    },
    visible: {
      y: "0%",
      opacity: 1,
      rotateX: 0,
      transition: {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1] // equivalent to expo.out
      }
    }
  };

  // Convert 'as' prop to motion component dynamically
  const MotionComponent = motion[as as keyof typeof motion] as any;

  return (
    <MotionComponent
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`inline-block ${className}`}
    >
      <span className="inline-flex flex-wrap gap-x-[0.28em]">
        {words.map((word, idx) => (
          <span 
            key={idx} 
            className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em]"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0% 100%)' }}
          >
            <motion.span 
              variants={wordVariants}
              className="word-inner inline-block will-change-transform transform-gpu origin-bottom"
            >
              {word}
            </motion.span>
          </span>
        ))}
      </span>
    </MotionComponent>
  );
};
