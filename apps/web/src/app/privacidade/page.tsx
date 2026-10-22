import type { Metadata } from 'next';
import { LegalDocumentView } from '@/features/legal/components/LegalDocumentView';
import { PRIVACY_POLICY } from '@/features/legal/documents';

export const metadata: Metadata = {
  title: 'Política de Privacidade | Base SST',
  description: 'Como a Base SST trata dados pessoais, por quanto tempo e como exercer seus direitos (LGPD).',
};

export default function PrivacyPage() {
  return <LegalDocumentView document={PRIVACY_POLICY} current="/privacidade" />;
}
