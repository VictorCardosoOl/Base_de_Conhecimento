import React from 'react';
import { HomeGrid } from '@/features/articles/components/HomeGrid';

export default async function Page(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const searchParams = await props.searchParams;
  const categoryParam =
    typeof searchParams?.category === 'string' ? searchParams.category : null;

  return (
    <div className="w-full">
      {/* A busca fica no cabeçalho (HeaderSearch). */}
      <div className="mt-4">
        <HomeGrid categoryParam={categoryParam} />
      </div>
    </div>
  );
}
