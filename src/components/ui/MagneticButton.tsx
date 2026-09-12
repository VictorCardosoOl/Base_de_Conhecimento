import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';

interface MagneticProps {
  children: React.ReactNode;
  className?: string;
  strength?: number;
  textStrength?: number;
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
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || !textRef.current) return;

    // Use quickTo for high-performance zero-lag DOM updates
    const xTo = gsap.quickTo(ref.current, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const yTo = gsap.quickTo(ref.current, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });
    
    const textXTo = gsap.quickTo(textRef.current, "x", { duration: 1, ease: "elastic.out(1, 0.3)" });
    const textYTo = gsap.quickTo(textRef.current, "y", { duration: 1, ease: "elastic.out(1, 0.3)" });

    const mouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { height, width, left, top } = ref.current!.getBoundingClientRect();
      const middleX = clientX - (left + width / 2);
      const middleY = clientY - (top + height / 2);
      
      xTo(middleX * strength);
      yTo(middleY * strength);
      textXTo(middleX * textStrength);
      textYTo(middleY * textStrength);
    };

    const mouseLeave = () => {
      xTo(0);
      yTo(0);
      textXTo(0);
      textYTo(0);
    };

    ref.current.addEventListener("mousemove", mouseMove);
    ref.current.addEventListener("mouseleave", mouseLeave);

    return () => {
      if (ref.current) {
        ref.current.removeEventListener("mousemove", mouseMove);
        ref.current.removeEventListener("mouseleave", mouseLeave);
      }
    };
  }, [strength, textStrength]);

  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`inline-block cursor-pointer ${className}`}
      {...rest}
    >
      <div ref={textRef} className="pointer-events-none">
        {children}
      </div>
    </div>
  );
};
