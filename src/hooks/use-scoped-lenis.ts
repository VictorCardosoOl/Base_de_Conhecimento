import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { lenisScopedConfig } from '@/lib/animations';

/**
 * useScopedLenis
 *
 * Inicializa uma instância scoped do Lenis dentro de um container (modal/painel),
 * gerenciando todo o ciclo de vida — start, RAF loop e destroy — automaticamente.
 *
 * Elimina a duplicação do bloco de ~40 linhas que existia em:
 * - ArticleModal.tsx
 * - LegalModal.tsx
 *
 * @param wrapperRef - Ref do elemento que faz o scroll (overflow container)
 * @param contentRef - Ref do elemento filho com o conteúdo real
 * @param isActive   - Se true, inicializa o Lenis; se false, destrói
 * @returns lenisRef - Ref da instância Lenis (para scroll programático se necessário)
 */
export function useScopedLenis(
  wrapperRef: React.RefObject<HTMLElement | null>,
  contentRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    let rafId: number | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let destroyed = false;

    if (isActive) {
      // Delay mínimo de 30ms para garantir que o DOM do modal esteja montado
      // antes de o Lenis medir os elementos.
      timer = setTimeout(() => {
        if (!destroyed && wrapperRef.current && contentRef.current) {
          const lenis = new Lenis({
            wrapper: wrapperRef.current,
            content: contentRef.current,
            ...lenisScopedConfig,
          });
          lenisRef.current = lenis;

          const raf = (time: number) => {
            if (destroyed) return;
            lenis.raf(time);
            rafId = requestAnimationFrame(raf);
          };
          rafId = requestAnimationFrame(raf);
        }
      }, 30);
    } else {
      lenisRef.current?.destroy();
      lenisRef.current = null;
    }

    return () => {
      destroyed = true;
      if (timer) clearTimeout(timer);
      if (rafId) cancelAnimationFrame(rafId);
      lenisRef.current?.destroy();
      lenisRef.current = null;
    };
  }, [isActive]);

  return lenisRef;
}
