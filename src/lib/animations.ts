// ============================================================
// src/lib/animations.ts
// SINGLE SOURCE OF TRUTH — Animações, Easings, Lenis e Scroll
//
// Este é o ÚNICO arquivo que você precisa editar para ajustar
// easings, durações ou gatilhos de animação de toda a aplicação.
// ============================================================

import type { Variants } from 'framer-motion';

// ─── 1. EASINGS ──────────────────────────────────────────────
// Todas as curvas de aceleração centralizadas aqui.
// Filosofia: movimentos físicos, nunca mecânicos.
// Formato: [x1, y1, x2, y2] — cubic-bezier equivalente.

export const ease = {
  /** power4.out — entrada rápida + desaceleração suave. Padrão da app. */
  out: [0.16, 1, 0.3, 1] as const,
  /** power3.inOut — simétrica. Para modais e painéis grandes. */
  inOut: [0.45, 0, 0.55, 1] as const,
  /** Sharp — saída abrupta. Para dismissals, overlays e exits. */
  sharp: [0.32, 0, 0.67, 0] as const,
  /** Fade — rápido para elementos pequenos (tooltips, badges). */
  fade: [0.25, 0, 0.3, 1] as const,
} as const;

// ─── 2. DURAÇÕES ─────────────────────────────────────────────
// Em segundos. Princípio: rápido o suficiente para não atrapalhar,
// lento o suficiente para ser percebido.

export const duration = {
  /** Micro-interações: hover em ícones, botões. */
  micro: 0.12,
  /** Transições rápidas: overlays, tooltips, badges. */
  fast: 0.22,
  /** Padrão: cards, banners, page transitions. */
  base: 0.38,
  /** Moderado: modais, sheets deslizantes. */
  moderate: 0.5,
  /** Slow: animações de entrada de elementos hero. */
  slow: 0.7,
  /** Extra slow: KineticText, efeito palavra-por-palavra. */
  xslow: 0.9,
} as const;

// ─── 3. VARIANTES DE FRAMER MOTION ───────────────────────────
// Todas as variantes usam APENAS transform e opacity.
// Nenhuma propriedade que cause layout thrashing (width, height, etc.).

/** Fade simples — para overlays e backdrops. */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: duration.fast, ease: ease.out },
  },
  exit: {
    opacity: 0,
    transition: { duration: duration.micro, ease: ease.fade },
  },
};

/** Slide-up + fade — padrão de entrada de painéis, banners e notificações. */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: 10,
    transition: { duration: duration.fast, ease: ease.sharp },
  },
};

/**
 * Sheet modal — desliza de baixo para cima.
 * Usado em: ArticleModal, LegalModal.
 */
export const sheetVariants: Variants = {
  hidden: { opacity: 0, y: '100vh' },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 240,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: '100vh',
    transition: { duration: duration.moderate, ease: ease.sharp },
  },
};

/**
 * Escala + fade — para modais centrais flutuantes.
 * Usado em: CommandPalette.
 * Nota: sem filter:blur — usa scale para a sensação de "pop" sem GPU cost.
 */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 10 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: duration.moderate,
      ease: ease.out,
      delay: 0.05,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: duration.fast, ease: ease.sharp },
  },
};

/** Page transition — usado no AnimatePresence do ClientLayout. */
export const pageVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: duration.base, ease: ease.out },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: duration.fast, ease: ease.sharp },
  },
};

/**
 * Card de artigo com stagger baseado no índice.
 * Usado em: ArticleGrid (CardItem).
 */
export const cardVariants = (index: number): Variants => ({
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: duration.base,
      delay: Math.min(0.18, index * 0.022),
      ease: ease.out,
    },
  },
});

/**
 * KineticText — container (orquestra o stagger entre palavras).
 * @param delay — atraso inicial antes de começar o stagger.
 */
export const kineticContainerVariants = (delay = 0): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.045, delayChildren: delay },
  },
});

/** KineticText — palavra individual (clip + rotateX para efeito de reveal). */
export const kineticWordVariants: Variants = {
  hidden: { y: '105%', opacity: 0, rotateX: 15 },
  visible: {
    y: '0%',
    opacity: 1,
    rotateX: 0,
    transition: { duration: duration.xslow, ease: ease.out },
  },
};

/**
 * IntroHero — linha do título monumental.
 * @param delay — atraso escalonado entre as linhas.
 */
export const heroLineVariants = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 90, rotate: 1.5 },
  visible: {
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: { duration: duration.slow, delay, ease: ease.out },
  },
});

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

/**
 * Barra de progresso de leitura (ArticleModal → useSpring(scrollYProgress)).
 * stiffness alta + damping moderado = resposta imediata sem overshooting.
 */
export const readingProgressSpring = {
  stiffness: 380,
  damping: 38,
  restDelta: 0.001,
} as const;
