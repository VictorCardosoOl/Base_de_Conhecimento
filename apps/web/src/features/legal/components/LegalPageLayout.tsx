import React from 'react';
import { type LegalPageHref } from '../institutional';
import type { LegalLink } from '../documents';
import { LegalPager } from './LegalPager';

export interface TocEntry {
  id: string;
  title: string;
}

/**
 * Estrutura comum das páginas institucionais: cabeçalho do documento, índice com âncoras,
 * corpo em superfície de leitura (largura confortável), referências e a navegação
 * contextual entre os documentos. Usa o cabeçalho e o rodapé do site (layout raiz).
 */
export function LegalPageLayout({
  current,
  title,
  meta,
  intro,
  toc,
  references,
  children,
}: {
  current: LegalPageHref;
  title: string;
  /** Linha de versão/revisão, quando conhecida. */
  meta?: React.ReactNode;
  intro: React.ReactNode;
  toc: TocEntry[];
  references?: LegalLink[];
  children: React.ReactNode;
}) {
  return (
    <article className="legal-page mx-auto max-w-5xl py-4" aria-labelledby="legal-title">
      <header className="max-w-[var(--measure-reading)]">
        <p className="ui-eyebrow">Documentos institucionais</p>
        <h1 id="legal-title" className="ui-page-title mt-2">
          {title}
        </h1>
        {meta && <p className="mt-3 text-sm text-text-muted">{meta}</p>}
        <div className="mt-5 text-base sm:text-lg leading-relaxed text-text-body">{intro}</div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-start">
        <div className="reading-surface min-w-0 px-5 py-8 sm:px-10 sm:py-10">
          <div className="legal-content max-w-[var(--measure-reading)]">{children}</div>
          {references && references.length > 0 && (
            <section aria-labelledby="legal-references" className="mt-10 border-t border-[color:color-mix(in_srgb,var(--text-main)_10%,transparent)] pt-6">
              <h2 id="legal-references" className="ui-label">
                Referências oficiais
              </h2>
              <ul className="mt-3 space-y-2 text-sm">
                {references.map((ref) => (
                  <li key={ref.href}>
                    <a href={ref.href} target="_blank" rel="noopener noreferrer" className="ui-link">
                      {ref.label}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <LegalPager current={current} />
        </div>

        <nav aria-label="Nesta página" className="order-first lg:order-none lg:sticky lg:top-28 glass-card p-5">
          <p className="ui-label">Nesta página</p>
          <ol className="mt-3 space-y-1.5 text-sm">
            {toc.map((entry) => (
              <li key={entry.id}>
                <a href={`#${entry.id}`} className="text-text-muted hover:text-text-main rounded-sm glass-focus">
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </div>
    </article>
  );
}
