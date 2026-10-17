'use client';

import { useRouter } from 'next/navigation';
import { ArticleModal } from '@/components/article/ArticleModal';
import { FAQ_DATA } from '@/config/index';

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
