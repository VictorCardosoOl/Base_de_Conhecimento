import type { Metadata } from 'next';
import { ResetPasswordForm } from './ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Criar nova senha | SST FAQ',
  robots: { index: false, follow: false },
  // O token vem no fragmento; mesmo assim, nada desta página vai para outros sites.
  referrer: 'no-referrer',
};

export default function ResetPasswordPage() {
  return <ResetPasswordForm />;
}
