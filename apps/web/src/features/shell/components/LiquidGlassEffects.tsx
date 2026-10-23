'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { readGlassPreference, subscribeGlassPreference } from '@/features/shell/glass-preference';

/**
 * Base do Liquid Glass, montada uma vez no layout:
 *
 * - fundo fixo e estático (.liquid-backdrop): pintado uma vez, nunca anima — conteúdo
 *   animado sob vidro obriga o navegador a refazer o desfoque a cada quadro;
 * - modo lite (html[data-glass='lite']) em aparelhos modestos, Save-Data ou com
 *   transparência reduzida: o vidro desfocado vira superfície sólida;
 * - entrada ao rolar: [data-reveal] aparece ao entrar na tela. Um IntersectionObserver
 *   por página (reaplicado a cada troca de rota), sem observar mutações do documento.
 */

interface NavigatorHints {
  deviceMemory?: number;
  connection?: { saveData?: boolean };
}

function prefers(query: string): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia(query).matches;
}

/** Aparelho modesto, mobile ou pedido explícito de economia. */
export function shouldUseLiteGlass(nav: Navigator & NavigatorHints = navigator): boolean {
  const lowCpu = typeof nav.hardwareConcurrency === 'number' && nav.hardwareConcurrency <= 4;
  const lowMemory = typeof nav.deviceMemory === 'number' && nav.deviceMemory <= 4;
  const isSmallScreen = typeof window !== 'undefined' && window.innerWidth < 768;
  return (
    lowCpu ||
    lowMemory ||
    isSmallScreen ||
    Boolean(nav.connection?.saveData) ||
    prefers('(prefers-reduced-transparency: reduce)')
  );
}

export function LiquidGlassEffects() {
  const pathname = usePathname();

  // A escolha manual (Minha conta) vence a detecção automática.
  useEffect(() => {
    const apply = () => {
      const preference = readGlassPreference();
      const lite = preference === 'auto' ? shouldUseLiteGlass() : preference === 'lite';
      document.documentElement.dataset.glass = lite ? 'lite' : 'full';
    };
    apply();
    return subscribeGlassPreference(apply);
  }, []);

  useEffect(() => {
    if (typeof IntersectionObserver !== 'function' || prefers('(prefers-reduced-motion: reduce)')) {
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).dataset.reveal = 'shown';
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -6% 0px', threshold: 0.06 }
    );
    // Depois do quadro da troca de rota, quando o conteúdo novo já está no DOM.
    const frame = window.requestAnimationFrame(() => {
      document
        .querySelectorAll<HTMLElement>('[data-reveal]:not([data-reveal="shown"])')
        .forEach((el) => {
          el.dataset.reveal = 'pending';
          observer.observe(el);
        });
    });
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      // O que ficou pendente (rota trocada antes de rolar até ele) volta a aparecer.
      document.querySelectorAll<HTMLElement>('[data-reveal="pending"]').forEach((el) => {
        el.dataset.reveal = 'shown';
      });
    };
  }, [pathname]);

  return <div className="liquid-backdrop" aria-hidden="true" />;
}
