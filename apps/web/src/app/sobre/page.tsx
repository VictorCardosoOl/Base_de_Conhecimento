import type { Metadata } from 'next';
import Link from 'next/link';
import {
  BookOpenCheck,
  Bookmark,
  CalendarClock,
  Layers,
  MessageSquareText,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { FAQ_DATA } from '@/features/articles/catalog';
import { Category } from '@/features/articles/types';
import { INSTITUTIONAL } from '@/features/legal/institutional';
import {
  AUDIENCE,
  COMMITMENTS,
  DISCLAIMER,
  FEATURES,
  MAINTENANCE,
  ORIGIN,
  CONSULTANTS,
  MAINTAINERS,
} from '@/features/sobre/about-content';
import { AboutAccountLink } from '@/features/sobre/components/AboutAccountLink';
import { ConsultantCard, MaintainerProfile } from '@/features/sobre/components/People';

export const metadata: Metadata = {
  title: 'Sobre | Base SST',
  description:
    'O que é a Base SST, para quem ela existe, quais recursos oferece e como o conteúdo sobre SST e eSocial é mantido.',
};

// Números do acervo publicado (catálogo do build).
const PUBLISHED = FAQ_DATA.filter((item) => item.category !== Category.SOBRE);
const MODULE_COUNT = new Set(PUBLISHED.map((item) => item.category)).size;

const FEATURE_ICONS: Record<string, LucideIcon> = {
  modulos: Layers,
  busca: Search,
  leitura: BookOpenCheck,
  lista: Bookmark,
  participacao: MessageSquareText,
  revisao: CalendarClock,
};

function SectionHeading({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children?: React.ReactNode }) {
  return (
    <header className="max-w-[var(--measure-reading)]">
      <p className="ui-eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-2 font-serif text-[clamp(1.6rem,1.2rem+1.4vw,2.25rem)] leading-tight text-text-main">
        {title}
      </h2>
      {children && <p className="mt-3 text-text-muted leading-relaxed">{children}</p>}
    </header>
  );
}

/**
 * Página "Sobre": apresentação institucional nativa do design system (Liquid Glass).
 * Superfícies sem desfoque para cartões e painéis, superfície de leitura para o texto
 * corrido; entrada ao rolar pelo [data-reveal] global (CSS + IntersectionObserver).
 */
export default function SobrePage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 sm:space-y-20 py-4">
      {/* 1. Apresentação */}
      <section aria-labelledby="sobre-titulo" className="glass-card rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14 lg:px-16">
        <div className="max-w-3xl">
          <p className="ui-eyebrow">Sobre</p>
          <h1 id="sobre-titulo" className="ui-page-title mt-3">
            Base SST
          </h1>
          <p className="mt-5 text-lg sm:text-xl leading-relaxed text-text-body">
            A Base SST reúne, em um só lugar, orientações práticas sobre Saúde e Segurança do Trabalho (SST) e eSocial, para
            consulta rápida no dia a dia de quem opera essas rotinas.
          </p>
        </div>
        <dl className="mt-8 grid max-w-xl grid-cols-3 gap-3">
          <div className="glass-flat px-4 py-3">
            <dt className="text-xs text-text-muted">Artigos</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-main">{PUBLISHED.length}</dd>
          </div>
          <div className="glass-flat px-4 py-3">
            <dt className="text-xs text-text-muted">Módulos</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-main">{MODULE_COUNT}</dd>
          </div>
          <div className="glass-flat px-4 py-3">
            <dt className="text-xs text-text-muted">Revisão (padrão)</dt>
            <dd className="text-2xl font-semibold tabular-nums text-text-main">
              12<span className="ml-1 text-sm font-medium text-text-muted">meses</span>
            </dd>
          </div>
        </dl>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/" variant="primary">
            Explorar artigos
          </ButtonLink>
          <ButtonLink href="#manutencao" variant="ghost">
            Como o conteúdo é mantido
          </ButtonLink>
        </div>
      </section>

      {/* 2. Propósito e público */}
      <section aria-labelledby="proposito" data-reveal className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div className="reading-surface px-6 py-8 sm:px-10 sm:py-10">
          <SectionHeading id="proposito" eyebrow="Propósito" title="Por que a Base SST existe" />
          <div className="mt-5 max-w-[var(--measure-reading)] space-y-4 leading-relaxed text-text-body">
            {ORIGIN.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
        <aside aria-labelledby="publico" className="glass-card p-6 sm:p-8">
          <h3 id="publico" className="text-lg font-semibold text-text-main">
            Para quem é
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-text-muted">
            Profissionais que lidam com obrigações de SST e eSocial, nas áreas de atuação previstas no cadastro:
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {AUDIENCE.map((area) => (
              <li key={area} className="ui-badge !normal-case !tracking-normal !text-xs">
                {area}
              </li>
            ))}
          </ul>
        </aside>
      </section>

      {/* 3. Recursos */}
      <section aria-labelledby="recursos" data-reveal className="space-y-8">
        <SectionHeading id="recursos" eyebrow="Recursos" title="O que você encontra">
          Os recursos abaixo estão disponíveis hoje na plataforma.
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = FEATURE_ICONS[feature.id] ?? Layers;
            return (
              <li key={feature.id} className="glass-card flex flex-col gap-3 p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[color:var(--tone-info-bg)] text-[color:var(--mesh-1)]">
                  <Icon size={19} aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold text-text-main">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-text-muted">{feature.description}</p>
                {feature.href && feature.linkLabel && (
                  <Link href={feature.href} className="ui-link mt-auto self-start text-sm font-medium">
                    {feature.linkLabel}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {/* 4. Manutenção do conteúdo */}
      <section id="manutencao" aria-labelledby="manutencao-titulo" data-reveal className="reading-surface scroll-mt-28 px-6 py-8 sm:px-10 sm:py-10">
        <SectionHeading id="manutencao-titulo" eyebrow="Conteúdo" title="Como o conteúdo é mantido" />
        <ol className="mt-6 max-w-[var(--measure-reading)] space-y-5">
          {MAINTENANCE.map((step, index) => (
            <li key={step} className="flex gap-4">
              <span
                aria-hidden="true"
                className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[color:color-mix(in_srgb,var(--mesh-1)_45%,transparent)] text-sm font-semibold text-[color:var(--mesh-1)]"
              >
                {index + 1}
              </span>
              <p className="leading-relaxed text-text-body">{step}</p>
            </li>
          ))}
        </ol>
        <Alert tone="info" role="note" className="mt-8 max-w-[var(--measure-reading)]">
          {DISCLAIMER}
        </Alert>
      </section>

      {/* 5. Compromissos */}
      <section aria-labelledby="compromissos" data-reveal className="space-y-8">
        <SectionHeading id="compromissos" eyebrow="Compromissos" title="Princípios que orientam a plataforma" />
        <ul className="glass-card grid divide-y divide-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)] sm:grid-cols-2 sm:divide-y-0">
          {COMMITMENTS.map((item, index) => (
            <li
              key={item.title}
              className={`p-6 sm:p-8 ${index > 1 ? 'sm:border-t' : ''} ${index % 2 === 1 ? 'sm:border-l' : ''} border-[color:color-mix(in_srgb,var(--text-main)_8%,transparent)]`}
            >
              <h3 className="text-base font-semibold text-text-main">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">{item.description}</p>
              {item.href && item.linkLabel && (
                <p className="mt-3 text-sm">
                  {item.href.startsWith('http') ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="ui-link font-medium">
                      {item.linkLabel}
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  ) : (
                    <Link href={item.href} className="ui-link font-medium">
                      {item.linkLabel}
                    </Link>
                  )}
                </p>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* 6. Quem faz a Base SST */}
      <section aria-labelledby="equipe" data-reveal className="space-y-8">
        <SectionHeading id="equipe" eyebrow="Equipe" title="Quem faz a Base SST">
          A plataforma é idealizada e desenvolvida por duas pessoas, responsáveis pela arquitetura, pela interface e pelos
          serviços que sustentam a base.
        </SectionHeading>
        <div className="space-y-10 lg:space-y-14">
          {MAINTAINERS.map((person, index) => (
            <MaintainerProfile key={person.id} person={person} reverse={index % 2 === 1} />
          ))}
        </div>
      </section>

      {/* 7. Consultoria técnica */}
      <section aria-labelledby="consultoria" data-reveal className="space-y-8">
        <SectionHeading id="consultoria" eyebrow="Consultoria" title="Consultoria técnica">
          Profissionais que contribuíram com conhecimento técnico e com a revisão do conteúdo publicado na base.
        </SectionHeading>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CONSULTANTS.map((person) => (
            <li key={person.id}>
              <ConsultantCard person={person} />
            </li>
          ))}
        </ul>
      </section>

      {/* 8. Encerramento */}
      <section aria-labelledby="comecar" data-reveal className="glass-card px-6 py-10 text-center sm:px-10">
        <h2 id="comecar" className="font-serif text-[clamp(1.5rem,1.2rem+1vw,2rem)] text-text-main">
          Comece pela busca ou pelos módulos
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-text-muted leading-relaxed">
          Para dúvidas sobre a plataforma ou sobre seus dados, escreva para{' '}
          <a href={`mailto:${INSTITUTIONAL.contactEmail}`} className="ui-link">
            {INSTITUTIONAL.contactEmail}
          </a>
          .
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" variant="primary">
            Explorar artigos
          </ButtonLink>
          <AboutAccountLink />
        </div>
      </section>
    </div>
  );
}
