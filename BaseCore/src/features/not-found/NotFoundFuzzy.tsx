'use client';

import React, { useEffect, useState } from 'react';
import FuzzyText from '@/components/ui/FuzzyText';

/**
 * Renderiza o "404" com FuzzyText usando as cores do tema atual.
 * O canvas não lê CSS vars, então resolvemos --text-main em runtime
 * e observamos a classe `dark` no <html> para acompanhar a troca de tema.
 */
export function NotFoundFuzzy() {
  const [color, setColor] = useState<string | null>(null);
  const [fontFamily, setFontFamily] = useState('serif');

  useEffect(() => {
    const read = () => {
      const styles = getComputedStyle(document.documentElement);
      setColor(styles.getPropertyValue('--text-main').trim() || '#000000');
      setFontFamily(styles.getPropertyValue('--font-serif').trim() || 'serif');
    };
    read();
    const observer = new MutationObserver(read);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Reserva o espaço para evitar layout shift enquanto o tema é resolvido
  if (!color) return <div aria-hidden className="h-[clamp(6rem,22vw,16rem)]" />;

  return (
    <div role="img" aria-label="Erro 404" className="flex justify-center cursor-crosshair">
      <FuzzyText
        fontSize="clamp(6rem, 22vw, 16rem)"
        fontWeight={400}
        fontFamily={fontFamily}
        color={color}
        baseIntensity={0.2}
        hoverIntensity={0.6}
        enableHover
        glitchMode
        glitchInterval={2600}
        glitchDuration={180}
        clickEffect
        transitionDuration={120}
        className="max-w-full h-auto"
      >
        404
      </FuzzyText>
    </div>
  );
}
