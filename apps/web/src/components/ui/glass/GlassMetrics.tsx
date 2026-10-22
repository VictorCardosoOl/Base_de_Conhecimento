'use client';
import React, { useEffect, useRef, useState } from 'react';

/**
 * Indicadores animados dos painéis de vidro. Só animam com prefers-reduced-motion em
 * "no-preference"; caso contrário, mostram o valor final na hora. Os números ficam no
 * DOM como texto (leitores de tela leem o valor final, via aria-label).
 */

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : true;
}

/** Dispara uma vez quando o elemento entra na tela (sem IntersectionObserver: na hora). */
function useInView<T extends Element>(): [React.RefObject<T | null>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver !== 'function') {
      const id = window.requestAnimationFrame(() => setInView(true));
      return () => window.cancelAnimationFrame(id);
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, inView];
}

/** Número que conta de 0 até `value` ao aparecer. */
export function AnimatedNumber({
  value,
  duration = 1100,
  suffix = '',
  className,
}: {
  value: number;
  duration?: number;
  suffix?: string;
  className?: string;
}) {
  const [ref, inView] = useInView<HTMLSpanElement>();
  const [shown, setShown] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion() || value === 0) {
      const id = window.requestAnimationFrame(() => setShown(value));
      return () => window.cancelAnimationFrame(id);
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 4); // easeOutQuart
      setShown(Math.round(value * eased));
      if (t < 1) frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [inView, value, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${value}${suffix}`}>
      <span aria-hidden="true">
        {shown}
        {suffix}
      </span>
    </span>
  );
}

/** Anel de progresso (0–100) com gradiente da malha; preenche ao aparecer. */
export function RingGauge({
  value,
  size = 112,
  stroke = 10,
  label,
  children,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label: string;
  children?: React.ReactNode;
}) {
  const [ref, inView] = useInView<SVGSVGElement>();
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - (inView ? clamped : 0) / 100);
  const gradientId = `ring-${label.replace(/\W+/g, '-')}`;

  return (
    <div className="relative inline-flex items-center justify-center" role="img" aria-label={`${label}: ${clamped}%`}>
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--mesh-2)" />
            <stop offset="55%" stopColor="var(--mesh-1)" />
            <stop offset="100%" stopColor="var(--mesh-3)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="color-mix(in srgb, var(--text-main) 10%, transparent)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1.2s var(--ease-out-expo)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" aria-hidden="true">
        {children}
      </div>
    </div>
  );
}

/** Barras horizontais (rótulo + valor) que crescem ao aparecer. */
export function BarList({
  items,
  label,
}: {
  items: Array<{ label: string; value: number }>;
  label: string;
}) {
  const [ref, inView] = useInView<HTMLUListElement>();
  const max = Math.max(1, ...items.map((item) => item.value));
  return (
    <ul ref={ref} aria-label={label} className="space-y-2.5">
      {items.map((item, index) => (
        <li key={item.label} className="space-y-1">
          <div className="flex items-baseline justify-between gap-3 text-xs">
            <span className="text-text-main font-medium truncate">{item.label}</span>
            <span className="text-text-muted tabular-nums">{item.value}</span>
          </div>
          <div className="h-2 rounded-full bg-[color-mix(in_srgb,var(--text-main)_8%,transparent)] overflow-hidden">
            <div
              className="h-full rounded-full origin-left bg-[linear-gradient(90deg,var(--mesh-2),var(--mesh-1),var(--mesh-3))] transition-transform duration-[1100ms] ease-[var(--ease-out-expo)] motion-reduce:transition-none"
              style={{
                transform: `scaleX(${inView ? item.value / max : 0})`,
                transitionDelay: `${index * 70}ms`,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
