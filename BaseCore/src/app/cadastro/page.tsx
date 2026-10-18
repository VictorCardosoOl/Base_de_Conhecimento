import type { Metadata } from 'next';
import { sanitizeNextPath } from '@/features/auth/redirect';
import { RegisterForm } from './RegisterForm';

export const metadata: Metadata = {
  title: 'Criar conta | SST FAQ',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Cadastro público: a conta nasce como leitor. O `next` é validado no servidor.
export default async function RegisterPage({ searchParams }: { searchParams: SearchParams }) {
  const { next } = await searchParams;
  return <RegisterForm next={sanitizeNextPath(Array.isArray(next) ? next[0] : next, '/conta')} />;
}
