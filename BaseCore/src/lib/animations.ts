// ============================================================
// src/lib/animations.ts
// SINGLE SOURCE OF TRUTH — Animações, Easings, Lenis e Scroll
//
// Este é o ÚNICO arquivo que você precisa editar para ajustar
// easings, durações ou gatilhos de animação de toda a aplicação.
// ============================================================

// ─── 4. CONFIGURAÇÃO DO LENIS ─────────────────────────────────
// Ajuste aqui para mudar o comportamento de scroll de TODA a aplicação.

/**
 * Lenis global — scroll suave da página inteira.
 * Usado em: SmoothScroll.tsx
 *
 * Tuning para sensação 120Hz:
 * - duration 1.1 + easing power4.out = inércia natural, sem bounce
 * - wheelMultiplier 1.0 = sem aceleração artificial
 * - touchMultiplier 1.8 = touch responsivo e vivo
 */
export const lenisGlobalConfig = {
  duration: 1.1,
  easing: (t: number): number => 1 - Math.pow(1 - t, 4),
  orientation: 'vertical' as const,
  gestureOrientation: 'vertical' as const,
  smoothWheel: true,
  wheelMultiplier: 1.0,
  touchMultiplier: 1.8,
} as const;

/**
 * Lenis scoped — scroll dentro de modais (ArticleModal, LegalModal).
 * Mais responsivo que o global pois o container é menor.
 *
 * - duration 0.65 = sentimento de scroll "nativo" dentro do painel
 * - mesmo easing do global para consistência cinética
 */
export const lenisScopedConfig = {
  duration: 0.65,
  easing: (t: number): number => 1 - Math.pow(1 - t, 4),
  orientation: 'vertical' as const,
  touchMultiplier: 1.8,
} as const;

// ─── 5. SPRING PRESETS ────────────────────────────────────────
// Springs para useSpring do Framer Motion (não são variantes).


