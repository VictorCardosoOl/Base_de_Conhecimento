import React from 'react';
import type { Metadata } from 'next';
import { HomeGrid } from '@/features/articles/components/HomeGrid';
import { requireSession } from '@/features/auth/session';

export const metadata: Metadata = {
  title: 'Artigos | Base SST',
  description: 'Catálogo de artigos, rotinas e orientações práticas de Saúde e Segurança do Trabalho e eSocial.',
};

export default async function ArtigosPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await props.searchParams;

  // Exige autenticação: se não estiver logado, redireciona para /login?next=/artigos
  await requireSession('/artigos', resolvedSearchParams);

  const categoryParam =
    typeof resolvedSearchParams?.category === 'string' ? resolvedSearchParams.category : null;

  return (
    <div className="w-full">
      <div className="mt-4">
        <HomeGrid categoryParam={categoryParam} />
      </div>
    </div>
  );
}
