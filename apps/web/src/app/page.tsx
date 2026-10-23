import React from 'react';
import type { Metadata } from 'next';
import {
  ArrowRight,
  Search,
  Sparkles,
  Layers,
  Award,
  CheckCircle2,
  Lock,
  BookmarkCheck,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { ButtonLink } from '@/components/ui/Button';
import { FAQ_DATA } from '@/features/articles/catalog';
import { Category } from '@/features/articles/types';
import {
  AUDIENCE,
  MAINTAINERS,
} from '@/features/sobre/about-content';
import { MaintainerProfile } from '@/features/sobre/components/People';

export const metadata: Metadata = {
  title: 'Base SST | Plataforma Inteligente de Segurança do Trabalho e eSocial',
  description:
    'A plataforma definitiva de conhecimento, procedimentos práticos e conformidade legal em SST e eSocial para empresas e profissionais.',
};

// Dados dinâmicos do acervo
const ARTICLES = FAQ_DATA.filter((item) => item.category !== Category.SOBRE);
const TOTAL_ARTICLES = ARTICLES.length;
const MODULES = Object.values(Category).filter((c) => c !== Category.SOBRE);

export default function HomePage() {
  return (
    <div className="w-full flex flex-col gap-24 sm:gap-32 py-4 sm:py-8">
      {/* ── 1. Hero Section (Design SaaS Moderno) ────────────────────────── */}
      <section className="relative flex flex-col items-center text-center max-w-4xl mx-auto px-4 pt-6 sm:pt-12">
        {/* Badge de Destaque */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-bg-island text-xs font-medium text-text-muted mb-6 shadow-xs animate-fade-in-up">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Plataforma Oficial de Conhecimento eSocial & NRs</span>
        </div>

        {/* Título Principal */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-text-main leading-[1.08]">
          Segurança do Trabalho e eSocial com clareza absoluta.
        </h1>

        {/* Subtítulo */}
        <p className="mt-6 text-lg sm:text-xl text-text-muted max-w-2xl font-light leading-relaxed">
          Centralize orientações técnicas, tabelas normativas, eventos do eSocial e rotinas práticas em uma experiência intuitiva desenvolvida para profissionais de alto nível.
        </p>

        {/* Botões de Ação (CTAs) */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4 w-full sm:w-auto">
          <ButtonLink
            href="/login?next=/artigos"
            variant="primary"
            className="!rounded-full px-8 py-3.5 text-base font-semibold shadow-md group"
          >
            <span>Acessar Plataforma</span>
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </ButtonLink>
          <ButtonLink
            href="/cadastro?next=/artigos"
            variant="secondary"
            className="!rounded-full px-8 py-3.5 text-base font-medium"
          >
            <span>Criar Conta Gratuita</span>
          </ButtonLink>
        </div>

        {/* Métricas Rápidas */}
        <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12 border-y border-border/60 py-6 w-full max-w-3xl">
          <div>
            <p className="text-3xl sm:text-4xl font-serif font-bold text-text-main">{TOTAL_ARTICLES}+</p>
            <p className="text-xs uppercase tracking-wider text-text-muted mt-1 font-mono">Artigos & Guias</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-serif font-bold text-text-main">{MODULES.length}</p>
            <p className="text-xs uppercase tracking-wider text-text-muted mt-1 font-mono">Módulos Especializados</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-serif font-bold text-text-main">100%</p>
            <p className="text-xs uppercase tracking-wider text-text-muted mt-1 font-mono">Conformidade Legal</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-serif font-bold text-text-main">24/7</p>
            <p className="text-xs uppercase tracking-wider text-text-muted mt-1 font-mono">Disponibilidade</p>
          </div>
        </div>
      </section>

      {/* ── 2. Módulos Temáticos (Prévia do Conteúdo) ────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="ui-eyebrow">Acervo Técnico</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-text-main">
            Estruturado pelos maiores pilares de SST
          </h2>
          <p className="mt-3 text-text-muted">
            Navegue por tópicos especializados que eliminam dúvidas de enquadramento, leiautes de envio e gestão operacional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((module) => {
            const count = ARTICLES.filter((a) => a.category === module).length;
            return (
              <div
                key={module}
                className="glass-card p-6 sm:p-8 rounded-[24px] flex flex-col justify-between border border-border/80 hover:border-text-main/30 transition-[border-color,transform] duration-200 hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <span className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/10 text-text-main">
                      <Layers size={20} />
                    </span>
                    <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-border/40 text-text-muted">
                      {count} artigos
                    </span>
                  </div>
                  <h3 className="text-xl font-serif font-semibold text-text-main">{module}</h3>
                  <p className="mt-2 text-sm text-text-muted leading-relaxed">
                    Orientações detalhadas, fluxos normativos e respostas fundamentadas para as rotinas de {module}.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/40 flex items-center justify-between text-xs font-semibold text-text-main">
                  <span>Acesso Exclusivo</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 3. Recursos & Diferenciais SaaS ──────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="glass-card rounded-[32px] p-8 sm:p-14 border border-border">
          <div className="max-w-2xl mb-12">
            <p className="ui-eyebrow">Diferenciais do SaaS</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-text-main">
              Construído para leitura rápida, foco e produtividade
            </h2>
            <p className="mt-3 text-text-muted">
              Uma experiência pensada nos mínimos detalhes para não fazer você perder tempo procurando em PDFs imensos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-main">
                <Search size={22} />
              </div>
              <h3 className="text-lg font-semibold text-text-main">Busca Inteligente & Tolerante</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Encontre o artigo exato mesmo com pequenas falhas de digitação ou buscando por termos técnicos e códigos de eventos.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-main">
                <BookmarkCheck size={22} />
              </div>
              <h3 className="text-lg font-semibold text-text-main">Minha Lista de Consulta</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Guarde artigos fundamentais na sua lista pessoal para consultar rapidamente durante reuniões ou preenchimento de laudos.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-main">
                <SlidersHorizontal size={22} />
              </div>
              <h3 className="text-lg font-semibold text-text-main">Tipografia & Acessibilidade</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Ajuste tamanho de texto, espaçamento, modo escuro e ative tipografia especializada para dislexia com um único clique.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-main">
                <Lock size={22} />
              </div>
              <h3 className="text-lg font-semibold text-text-main">Segurança Enterprise</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Autenticação assimétrica EdDSA (Ed25519), cookies protegidos contra CSRF/XSS e isolamento completo de sessões.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-main">
                <Sparkles size={22} />
              </div>
              <h3 className="text-lg font-semibold text-text-main">Ambiente Zen Livre de Ruído</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Ative o modo Zen para focar 100% na interpretação da norma, ocultando barras e menus laterais durante leituras longas.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="w-12 h-12 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center text-text-main">
                <Award size={22} />
              </div>
              <h3 className="text-lg font-semibold text-text-main">Revisão Contínua</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                Orientações atualizadas segundo as mais recentes portarias do MTE e do Conselho Curador do FGTS/eSocial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 4. Público-Alvo ──────────────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8 mb-10">
          <div>
            <p className="ui-eyebrow">A Quem Se Destina</p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-text-main">
              Feito para quem decide e opera
            </h2>
          </div>
          <p className="text-sm text-text-muted max-w-md">
            Atendemos os setores que precisam de precisão documental para evitar passivos trabalhistas e multas fiscais.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {AUDIENCE.map((item) => (
            <div
              key={item}
              className="p-5 rounded-2xl border border-border/70 bg-bg-island flex items-center gap-3 shadow-xs"
            >
              <CheckCircle2 size={18} className="text-text-main shrink-0" />
              <span className="text-sm font-medium text-text-body">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. Quem Somos (Autores & Mantenedores) ────────────────────────── */}
      <section className="max-w-6xl mx-auto px-4 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="ui-eyebrow">Quem Desenvolveu</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-serif font-bold text-text-main">
            Equipe do Projeto
          </h2>
          <p className="mt-3 text-text-muted">
            Conheça os idealizadores e desenvolvedores responsáveis pela concepção técnica e arquitetura da Base SST.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {MAINTAINERS.map((maintainer) => (
            <MaintainerProfile key={maintainer.name} person={maintainer} />
          ))}
        </div>
      </section>

      {/* ── 6. CTA Final de Conversão ────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 text-center w-full mb-8">
        <div className="glass-card rounded-[36px] p-10 sm:p-16 border border-border relative overflow-hidden">
          <h2 className="text-3xl sm:text-5xl font-serif font-bold text-text-main leading-tight">
            Pronto para transformar sua rotina em SST?
          </h2>
          <p className="mt-4 text-text-muted max-w-xl mx-auto text-base sm:text-lg">
            Tenha em mãos o guia definitivo de consultas, eventos e fluxos operacionais agora mesmo.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <ButtonLink
              href="/login?next=/artigos"
              variant="primary"
              className="!rounded-full px-10 py-4 text-base font-semibold shadow-lg group"
            >
              <span>Entrar na Plataforma</span>
              <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </ButtonLink>
          </div>
        </div>
      </section>
    </div>
  );
}
