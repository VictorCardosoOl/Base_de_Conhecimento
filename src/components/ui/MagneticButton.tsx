import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number; // Intensidade do magnetismo (default: 0.25)
  textStrength?: number; // Intensidade do texto interno (default: 0.12 para efeito de profundidade)
  onClick?: (e: React.MouseEvent) => void;
  [key: string]: any;
}

export const Magnetic: React.FC<MagneticProps> = ({
  children,
  className = '',
  strength = 0.28,
  textStrength = 0.14,
  onClick,
  ...rest
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const { clientX, clientY } = e;
    const { height, width, left, top } = ref.current.getBoundingClientRect();
    const middleX = clientX - (left + width / 2);
    const middleY = clientY - (top + height / 2);
    setPosition({ x: middleX * strength, y: middleY * strength });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.15 }}
      className={`inline-block ${className}`}
      {...rest}
    >
      <motion.div
        animate={{ x: position.x * (textStrength / strength), y: position.y * (textStrength / strength) }}
        transition={{ type: 'spring', stiffness: 380, damping: 28, mass: 0.15 }}
      >
        {children}
      </motion.div>
    </motion.div>
  );
};
