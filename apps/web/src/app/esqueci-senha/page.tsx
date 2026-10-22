import type { Metadata } from 'next';
import { sanitizeNextPath } from '@/features/auth/redirect';
import { ForgotPasswordForm } from './ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Esqueci a senha | SST FAQ',
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { next } = await searchParams;
  return (
    <ForgotPasswordForm
      next={sanitizeNextPath(Array.isArray(next) ? next[0] : next)}
    />
  );
}
