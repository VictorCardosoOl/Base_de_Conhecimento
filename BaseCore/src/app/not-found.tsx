import type { Metadata } from 'next';
import { ButtonLink } from '@/components/ui/Button';
import { StatusPage } from '@/components/ui/StatusPage';

export const metadata: Metadata = {
  title: 'Página não encontrada | Base SST',
  description: 'O caminho que você tentou acessar não existe ou foi movido.',
  robots: { index: false },
};

/**
 * Fallback global: o Next.js renderiza este arquivo para qualquer URL sem rota
 * correspondente e também quando `notFound()` é chamado (ex.: /artigo/[id] inexistente).
 * Renderiza dentro do root layout, então herda cabeçalho, rodapé e tema.
 */
export default function NotFound() {
  return (
    <StatusPage
      code="404"
      title="Página não encontrada"
      actions={
        <>
          <ButtonLink href="/" variant="primary" id="not-found-home-button">
            Ir para a página inicial
          </ButtonLink>
          <ButtonLink href="/minha-lista">Minha Lista</ButtonLink>
        </>
      }
    >
      O endereço pode ter sido digitado errado, o artigo pode ter mudado de lugar ou nunca ter existido. Use a busca no topo
      (atalho Ctrl+K) para encontrar o assunto.
    </StatusPage>
  );
}
