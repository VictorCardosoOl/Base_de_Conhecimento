import type { Metadata } from 'next';
import { VerifyEmail } from './VerifyEmail';

export const metadata: Metadata = {
  title: 'Confirmação de email | SST FAQ',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default function VerifyEmailPage() {
  return <VerifyEmail />;
}
