import type { Metadata } from 'next';
import { SocialSignupForm } from './SocialSignupForm';

export const metadata: Metadata = {
  title: 'Concluir cadastro | SST FAQ',
  robots: { index: false, follow: false },
};

// Etapa posterior ao login social: a conta só nasce depois de usuário, nome e termos.
export default function SocialSignupPage() {
  return <SocialSignupForm />;
}
