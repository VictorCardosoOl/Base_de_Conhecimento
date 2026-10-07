import Link from 'next/link';
import type { Metadata } from 'next';
import { NotFoundFuzzy } from '@/features/not-found/NotFoundFuzzy';

export const metadata: Metadata = {
  title: 'Página não encontrada | Base SST',
  description: 'O caminho que você tentou acessar não existe ou foi movido.',
  robots: { index: false },
};

/**
 * Fallback global: o Next.js renderiza este arquivo para qualquer URL sem rota
 * correspondente e também quando `notFound()` é chamado (ex.: /artigo/[id] inexistente).
 * Renderiza dentro do root layout, então herda Sidebar, Footer e tema.
 */
export default function NotFound() {
  return (
    <section className="min-h-[70vh] flex flex-col items-center justify-center text-center py-16">
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-text-muted mb-6">
        Erro · Rota inexistente
      </span>

      <NotFoundFuzzy />

      <h1 className="font-serif text-3xl md:text-5xl text-text-main tracking-tight mt-6 mb-4">
        Ops! Página não encontrada
      </h1>

      <p className="max-w-md text-base md:text-lg text-text-muted leading-relaxed mb-10">
        O link ou botão que você clicou não leva a lugar nenhum — o endereço pode ter sido
        digitado errado, movido ou nunca ter existido.
      </p>

      <Link
        href="/"
        id="not-found-home-button"
        className="group inline-flex items-center gap-3 rounded-full border border-text-main px-7 py-3 text-xs uppercase tracking-widest font-semibold text-text-main hover:bg-text-main hover:text-bg-main transition-colors duration-300"
      >
        <span aria-hidden className="transition-transform duration-300 group-hover:-translate-x-1">
          ←
        </span>
        Voltar para a Página Inicial
      </Link>
    </section>
  );
}
