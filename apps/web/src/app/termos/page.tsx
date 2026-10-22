import type { Metadata } from 'next';
import { LegalDocumentView } from '@/features/legal/components/LegalDocumentView';
import { TERMS_OF_USE } from '@/features/legal/documents';

export const metadata: Metadata = {
  title: 'Termos de Uso | Base SST',
  description: 'Condições para utilizar a Base SST: acesso, conta, regras de participação e responsabilidades.',
};

export default function TermsPage() {
  return <LegalDocumentView document={TERMS_OF_USE} current="/termos" />;
}
