'use client';

import { useRouter } from 'next/navigation';
import { ArticleModal } from '@/features/articles/components/ArticleModal';
import { FAQ_DATA } from '@/features/articles/catalog';

export function ModalWrapper({ id }: { id: string }) {
  const router = useRouter();
  const article = FAQ_DATA.find(a => a.id === id);

  if (!article) return null;

  return (
    <ArticleModal
      isOpen={true}
      onClose={() => router.back()}
      item={article}
    />
  );
}
