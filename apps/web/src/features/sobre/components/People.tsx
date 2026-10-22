import React from 'react';
import Image from 'next/image';
import { Globe, Link2 } from 'lucide-react';
import { buttonClass } from '@/components/ui/Button';
import { GithubIcon, LinkedinIcon } from '@/components/ui/BrandIcons';
import type { Consultant, Maintainer, ProfileLink, ProfileLinkKind } from '../about-content';

const LINK_LABEL: Record<ProfileLinkKind, (name: string) => string> = {
  portfolio: (name) => `Portfólio de ${name}`,
  links: (name) => `Página de links de ${name}`,
  linkedin: (name) => `LinkedIn de ${name}`,
  github: (name) => `GitHub de ${name}`,
};

const LINK_ICON: Record<ProfileLinkKind, React.ComponentType<{ size?: number }>> = {
  portfolio: ({ size }) => <Globe size={size} aria-hidden="true" />,
  links: ({ size }) => <Link2 size={size} aria-hidden="true" />,
  linkedin: LinkedinIcon,
  github: GithubIcon,
};

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

/** Botão de perfil externo: rótulo com a pessoa e o destino, ícone do tipo de destino. */
export function ProfileLinkButton({ name, link, className = '' }: { name: string; link: ProfileLink; className?: string }) {
  const Icon = LINK_ICON[link.kind];
  return (
    <a href={link.url} target="_blank" rel="noopener noreferrer" className={buttonClass({ size: 'sm' }, className)}>
      <Icon size={15} />
      {LINK_LABEL[link.kind](name)}
      <span className="sr-only"> (abre em nova aba)</span>
    </a>
  );
}

/**
 * Foto autorizada ou, sem ela, as iniciais. Proporção fixa (sem deslocamento de layout);
 * a foto carrega sob demanda (fora da primeira dobra).
 */
function Portrait({ name, photo, shape }: { name: string; photo?: string; shape: 'portrait' | 'avatar' }) {
  const frame =
    shape === 'portrait'
      ? 'aspect-[4/5] w-full rounded-[calc(var(--glass-radius-lg)-0.5rem)]'
      : 'h-16 w-16 rounded-2xl';
  return (
    <div className={`relative overflow-hidden ${frame} bg-[linear-gradient(150deg,var(--mesh-1),var(--glass-accent-deep))]`}>
      {photo ? (
        <Image
          src={photo}
          alt={`Foto de ${name}`}
          fill
          loading="lazy"
          sizes={shape === 'portrait' ? '(min-width: 1024px) 320px, 90vw' : '64px'}
          className="object-cover"
        />
      ) : (
        // Sem foto: as iniciais são decorativas (o nome está no título ao lado).
        <span
          aria-hidden="true"
          className={`absolute inset-0 grid place-items-center font-serif text-white/95 ${shape === 'portrait' ? 'text-6xl sm:text-7xl' : 'text-xl'}`}
        >
          {initials(name)}
        </span>
      )}
      {/* Realce especular discreto sobre a foto (vidro), sem desfoque. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] bg-[linear-gradient(160deg,rgba(255,255,255,0.22),transparent_45%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]"
      />
    </div>
  );
}

/**
 * Perfil de quem desenvolve a plataforma. HTML sempre na ordem foto → texto → link; com
 * `reverse`, só a grade (desktop) leva a foto para a direita, sem reordenar o conteúdo.
 */
export function MaintainerProfile({ person, reverse = false }: { person: Maintainer; reverse?: boolean }) {
  const titleId = `${person.id}-nome`;
  return (
    <article aria-labelledby={titleId} className="grid items-center gap-6 lg:grid-cols-12 lg:gap-10">
      <div className={`glass-card mx-auto w-full max-w-[15rem] sm:max-w-xs p-2 lg:col-span-4 lg:row-start-1 lg:max-w-none ${reverse ? 'lg:col-start-9' : 'lg:col-start-1'}`}>
        <Portrait name={person.name} photo={person.photo} shape="portrait" />
      </div>
      <div className={`reading-surface px-6 py-8 sm:px-9 lg:col-span-8 lg:row-start-1 ${reverse ? 'lg:col-start-1' : 'lg:col-start-5'}`}>
        <p className="ui-eyebrow">{person.role}</p>
        <h3 id={titleId} className="mt-2 font-serif text-[clamp(1.5rem,1.2rem+1vw,2rem)] leading-tight text-text-main">
          {person.name}
        </h3>
        <div className="mt-4 max-w-[var(--measure-reading)] space-y-3 leading-relaxed text-text-body">
          {person.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <h4 className="mt-6 ui-label">Contribuições no projeto</h4>
        <ul className="mt-3 grid gap-2 text-sm leading-relaxed text-text-body sm:grid-cols-2">
          {person.highlights.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--mesh-1)]" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          <ProfileLinkButton name={person.name} link={person.link} />
        </div>
      </div>
    </article>
  );
}

/**
 * Cartão de consultoria: quadrado quando o conteúdo cabe; se não couber (telas estreitas,
 * fonte ampliada), a altura cresce em vez de cortar o texto (aspect-ratio com altura mínima
 * automática).
 */
export function ConsultantCard({ person }: { person: Consultant }) {
  const titleId = `${person.id}-nome`;
  return (
    <article aria-labelledby={titleId} className="glass-card flex aspect-square flex-col p-6 sm:p-7">
      <div className="flex items-center gap-4">
        <Portrait name={person.name} photo={person.photo} shape="avatar" />
        <div className="min-w-0">
          <h3 id={titleId} className="text-lg font-semibold leading-snug text-text-main">
            {person.name}
          </h3>
          <p className="text-sm text-text-muted">{person.role}</p>
        </div>
      </div>
      <h4 className="mt-6 ui-label">Contribuições</h4>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-text-body">
        {person.contributions.map((item) => (
          <li key={item} className="flex gap-2">
            <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[color:var(--mesh-1)]" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      <div className="mt-auto pt-6">
        <ProfileLinkButton name={person.name} link={person.link} className="w-full justify-center" />
      </div>
    </article>
  );
}
