import React from 'react';
import Link from 'next/link';
import type { LegalDocument } from '../documents';
import type { LegalPageHref } from '../institutional';
import { LegalPageLayout } from './LegalPageLayout';

/** Página de um documento legal (Termos, Privacidade), com versão e data de revisão visíveis. */
export function LegalDocumentView({ document, current }: { document: LegalDocument; current: LegalPageHref }) {
  return (
    <LegalPageLayout
      current={current}
      title={document.title}
      meta={
        <>
          Versão <span className="font-mono">{document.version}</span> · última revisão do texto em {document.updatedAt}
        </>
      }
      intro={<p>{document.intro}</p>}
      toc={document.sections.map((section) => ({ id: section.id, title: section.title }))}
      references={document.references}
    >
      {document.sections.map((section) => (
        <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="legal-section">
          <h2 id={`${section.id}-title`}>{section.title}</h2>
          {section.paragraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.items && (
            <ul>
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {section.after?.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
          {section.links && (
            <p className="legal-links">
              {section.links.map((link) => (
                <Link key={link.href} href={link.href} className="ui-link">
                  {link.label}
                </Link>
              ))}
            </p>
          )}
        </section>
      ))}
    </LegalPageLayout>
  );
}
