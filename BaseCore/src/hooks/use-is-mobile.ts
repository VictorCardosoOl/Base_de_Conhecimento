"use client";
import { useEffect, useState } from 'react';

/** Abaixo do breakpoint `lg` do Tailwind (1024px), o menu vira gaveta. */
export const MOBILE_QUERY = '(max-width: 1023.98px)';

/** true em telas de celular/tablet. Começa em false (igual ao servidor) e atualiza no cliente. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}
