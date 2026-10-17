import { FAQ_DATA } from '@/config/index';
import { notFound } from 'next/navigation';
import { ModalWrapper } from './ModalWrapper';

export async function generateStaticParams() {
  return FAQ_DATA.map((article) => ({
    id: article.id,
  }));
}

export default async function ModalArticlePage({ params }: { params: { id: string } }) {
  const { id } = await Promise.resolve(params);

  return <ModalWrapper id={id} />;
}
