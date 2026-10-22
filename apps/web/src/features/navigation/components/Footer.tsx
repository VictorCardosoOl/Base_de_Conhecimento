'use client';
import React from 'react';
import Link from 'next/link';
import { Logo } from '@/components/ui/Logo';
import { GithubIcon } from '@/components/ui/BrandIcons';
import { FAQ_DATA } from '@/features/articles/catalog';
import { recentArticles } from '@/features/articles/article-meta';
import { Category } from '@/features/articles/types';
import { useCurrentSession } from '@/features/auth/use-session-summary';
import { VersionButton } from './VersionButton';


const SUPPORT_EMAIL = 'suporte@basesst.br';

const DESIGNERS = [
  { name: 'Victor Cardoso', href: 'https://victor-cardoso.vercel.app' },
  { name: 'Guilherme Cruz', href: 'https://gcruz.dev.br' },
];

// Números do acervo publicado (catálogo do build): nada estimado.
const PUBLISHED = FAQ_DATA.filter((item) => item.category !== Category.SOBRE);
const MODULE_COUNTS = Object.values(Category)
  .filter((cat) => cat !== Category.SOBRE)
  .map((cat) => ({ cat, count: PUBLISHED.filter((item) => item.category === cat).length }))
  .filter((entry) => entry.count > 0);
const RECENT = recentArticles(3);

const linkClass =
  'inline-flex min-h-8 items-center text-sm text-text-muted hover:text-text-main transition-colors rounded-md glass-focus';
const headingClass = 'ui-label mb-3';

/**
 * Rodapé: marca e números do acervo, todos os módulos, artigos atualizados
 * recentemente, atalhos de conta (conforme a sessão), créditos e documentos legais. Preferências visuais ficam em Minha conta. Nenhum link sem destino.
 */
export const Footer = () => {
  const session = useCurrentSession();
  const signedIn = session?.authenticated === true;

  const account = signedIn
    ? [
        { href: '/conta', label: 'Minha conta' },
        { href: '/minha-lista', label: 'Minha Lista' },
      ]
    : [
        { href: '/cadastro', label: 'Criar conta' },
        { href: '/login', label: 'Entrar' },
        { href: '/minha-lista', label: 'Minha Lista' },
      ];

  return (
    <footer className="relative z-10 w-full text-text-body font-sans px-5 sm:px-8 2xl:px-16 3xl:px-24 4xl:px-32 pb-20 sm:pb-8 pt-12">
      <div className="glass-card max-w-[2000px] 4xl:max-w-[2400px] mx-auto !rounded-[2rem] p-6 sm:p-8 lg:p-10 shadow-[var(--glass-shadow-2)]">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6">
          <div className="sm:col-span-2 lg:col-span-4 flex flex-col gap-5">
            <Link href="/" aria-label="Base SST — início" className="self-start rounded-md glass-focus">
              <Logo />
            </Link>
            <p className="text-sm text-text-muted max-w-sm leading-relaxed">
              Respostas diretas e revisadas sobre Saúde e Segurança do Trabalho e eSocial, para quem opera os eventos no dia a dia.
            </p>
            <dl className="grid grid-cols-2 gap-3 max-w-xs">
              <div className="glass-flat px-3 py-2.5">
                <dt className="text-xs text-text-muted">Artigos</dt>
                <dd className="text-xl font-semibold text-text-main tabular-nums">{PUBLISHED.length}</dd>
              </div>
              <div className="glass-flat px-3 py-2.5">
                <dt className="text-xs text-text-muted">Módulos</dt>
                <dd className="text-xl font-semibold text-text-main tabular-nums">{MODULE_COUNTS.length}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <a href={`mailto:${SUPPORT_EMAIL}`} className="ui-link">
                {SUPPORT_EMAIL}
              </a>
              <a
                href="https://github.com/VictorCardosoOl/Base_de_Conhecimento"
                className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon"
                aria-label="Código-fonte no GitHub"
              >
                <GithubIcon />
              </a>
            </div>
          </div>

          <nav aria-label="Módulos" className="lg:col-span-2">
            <h2 className={headingClass}>Módulos</h2>
            <ul className="flex flex-col gap-0.5">
              {MODULE_COUNTS.map(({ cat, count }) => (
                <li key={cat}>
                  <Link href={`/?category=${encodeURIComponent(cat)}`} className={`${linkClass} gap-2`}>
                    {cat}
                    <span className="text-xs tabular-nums opacity-70">{count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Atualizados recentemente" className="lg:col-span-3">
            <h2 className={headingClass}>Atualizados recentemente</h2>
            <ul className="flex flex-col gap-3">
              {RECENT.map((item) => (
                <li key={item.id}>
                  <Link href={`/artigo/${item.id}`} className="group block rounded-md glass-focus">
                    <span className="block text-sm text-text-main group-hover:underline underline-offset-2 line-clamp-2">
                      {item.question}
                    </span>
                    <span className="block text-xs text-text-muted">
                      {item.category} · {item.lastReviewed || item.date}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="sm:col-span-2 lg:col-span-3 flex flex-col gap-6">
            <nav aria-label={signedIn ? 'Sua conta' : 'Participe'}>
              <h2 className={headingClass}>{signedIn ? 'Sua conta' : 'Participe'}</h2>
              <ul className="flex flex-col gap-0.5">
                {account.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className={linkClass}>
                      {link.label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/sobre" className={linkClass}>
                    Sobre o projeto
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Ordem em todas as larguras: copyright e créditos, versão (centralizada), links institucionais. */}
        <div className="mt-8 pt-5 border-t border-[color:color-mix(in_srgb,var(--text-main)_9%,transparent)] grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-3 text-xs text-text-muted">
          <p className="text-center lg:text-left lg:justify-self-start">
            © {new Date().getFullYear()} Base SST · Design by{' '}
            {DESIGNERS.map((designer, index) => (
              <React.Fragment key={designer.href}>
                {index > 0 && ' and '}
                <a href={designer.href} target="_blank" rel="noopener noreferrer" className="ui-link whitespace-nowrap">
                  {designer.name}
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </React.Fragment>
            ))}
          </p>
          <div className="justify-self-center">
            <VersionButton />
          </div>
          <nav aria-label="Documentos legais" className="flex flex-wrap items-center justify-center lg:justify-self-end gap-x-4 gap-y-1">
            <Link href="/termos" className={linkClass + ' !text-xs'}>
              Termos de uso
            </Link>
            <Link href="/privacidade" className={linkClass + ' !text-xs'}>
              Privacidade
            </Link>
            <Link href="/cookies" className={linkClass + ' !text-xs'}>
              Preferências de cookie
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};
