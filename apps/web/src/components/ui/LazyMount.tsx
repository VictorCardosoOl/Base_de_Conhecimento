'use client';
import React, { useEffect, useRef, useState } from 'react';

/**
 * Monta os filhos depois da abertura da página: no primeiro momento ocioso (sem disputar
 * quadros com a animação de entrada nem com a rolagem) ou, antes disso, quando o lugar
 * deles se aproxima da tela. Sem IntersectionObserver, monta já.
 */
export function LazyMount({
  children,
  minHeight = 320,
  rootMargin = '800px 0px',
  idleDelayMs = 1200,
}: {
  children: React.ReactNode;
  minHeight?: number;
  rootMargin?: string;
  idleDelayMs?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Começa sempre pelo espaço reservado: o servidor (sem IntersectionObserver) e a primeira
  // renderização no navegador precisam produzir o mesmo HTML (senão: erro de hidratação).
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible || !ref.current) return;
    if (typeof IntersectionObserver === 'undefined') {
      // Sem como observar: monta logo depois da hidratação (fora do corpo do efeito).
      let active = true;
      queueMicrotask(() => {
        if (active) setVisible(true);
      });
      return () => {
        active = false;
      };
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );
    observer.observe(ref.current);
    // Ocioso: espera a entrada assentar e usa uma folga do navegador.
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number })
      .requestIdleCallback;
    let idleId = 0;
    const timer = window.setTimeout(() => {
      if (idle) idleId = idle(() => setVisible(true), { timeout: 3000 });
    }, idleDelayMs);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      if (idleId) (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId);
    };
  }, [visible, rootMargin, idleDelayMs]);

  return visible ? <>{children}</> : <div ref={ref} style={{ minHeight }} aria-hidden="true" />;
}
