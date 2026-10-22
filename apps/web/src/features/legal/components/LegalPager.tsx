import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Home } from 'lucide-react';
import { buttonClass } from '@/components/ui/Button';
import { LEGAL_PAGES, type LegalPageHref } from '../institutional';

/** Vizinhos de uma página na sequência fixa Termos → Privacidade → Cookies. */
export function legalNeighbors(current: LegalPageHref) {
  const index = LEGAL_PAGES.findIndex((page) => page.href === current);
  return {
    previous: index > 0 ? LEGAL_PAGES[index - 1] : null,
    next: index >= 0 && index < LEGAL_PAGES.length - 1 ? LEGAL_PAGES[index + 1] : null,
  };
}

// Mesma largura nas três linhas: a coluna fica alinhada e centralizada.
const ROW = 'w-full max-w-sm';

/**
 * Navegação contextual no fim de cada documento, em coluna e centralizada: Página anterior,
 * HOME (ação em destaque) e Próxima página. Nas pontas da sequência, a opção sem destino
 * não é exibida. Os destinos são explícitos (não dependem do histórico do navegador).
 */
export function LegalPager({ current }: { current: LegalPageHref }) {
  const { previous, next } = legalNeighbors(current);
  return (
    <nav
      aria-label="Navegação entre documentos"
      className="mt-12 border-t border-[color:color-mix(in_srgb,var(--text-main)_10%,transparent)] pt-8"
    >
      <ul className="flex flex-col items-center gap-3">
        {previous && (
          <li className={ROW}>
            <Link href={previous.href} rel="prev" className={buttonClass({ block: true }, 'justify-between')}>
              <ArrowLeft size={16} aria-hidden="true" />
              <span className="flex flex-col items-center leading-tight">
                <span className="text-[11px] font-medium text-text-muted">Página anterior</span>{' '}
                <span>{previous.title}</span>
              </span>
              <span className="w-4" aria-hidden="true" />
            </Link>
          </li>
        )}
        <li className={ROW}>
          <Link
            href="/"
            aria-label="Voltar para a Home"
            className={buttonClass({ variant: 'primary', block: true }, 'uppercase tracking-[0.16em]')}
          >
            <Home size={16} aria-hidden="true" />
            Home
          </Link>
        </li>
        {next && (
          <li className={ROW}>
            <Link href={next.href} rel="next" className={buttonClass({ block: true }, 'justify-between')}>
              <span className="w-4" aria-hidden="true" />
              <span className="flex flex-col items-center leading-tight">
                <span className="text-[11px] font-medium text-text-muted">Próxima página</span>{' '}
                <span>{next.title}</span>
              </span>
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  );
}
