'use client';
import { useEffect, type RefObject } from 'react';

/**
 * Barra de progresso de leitura sem re-renderizar nada: escreve `transform: scaleX()`
 * direto no elemento, no máximo uma vez por quadro, a partir de um listener passivo.
 *
 * - `container`: elemento que rola (modal). Sem ele, usa a janela e mede o progresso
 *   pelo `target` (o corpo do artigo).
 */
export function useReadingProgress(
  barRef: RefObject<HTMLElement | null>,
  options: { container?: RefObject<HTMLElement | null>; target?: RefObject<HTMLElement | null>; active?: boolean }
) {
  const { container, target, active = true } = options;

  useEffect(() => {
    if (!active) return;
    const scroller: HTMLElement | Window = container?.current ?? window;
    let frame = 0;
    let last = -1;

    const measure = () => {
      frame = 0;
      const bar = barRef.current;
      if (!bar) return;
      let progress = 0;
      if (scroller instanceof HTMLElement) {
        const max = scroller.scrollHeight - scroller.clientHeight;
        progress = max > 0 ? scroller.scrollTop / max : 0;
      } else if (target?.current) {
        const rect = target.current.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.6;
        progress = total > 0 ? -rect.top / total : 0;
      }
      progress = Math.min(1, Math.max(0, progress));
      // Só escreve quando muda de forma perceptível (evita trabalho de estilo à toa).
      if (Math.abs(progress - last) < 0.002) return;
      last = progress;
      bar.style.transform = `scaleX(${progress})`;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [barRef, container, target, active]);
}
