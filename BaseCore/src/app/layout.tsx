import '@/assets/styles/global.css';
import { Metadata, Viewport } from 'next';
import { ClientLayout } from './ClientLayout';
import { ConsentProvider } from '@/contexts/ConsentContext';

import { Inter, Playfair_Display, Lexend } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});
const lexend = Lexend({
  subsets: ['latin'],
  variable: '--font-lexend',
  display: 'swap',
});

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'Base de Conhecimento SST | Padrão eSocial',
  description:
    'Guias oficiais, diretrizes e procedimentos consolidados de Saúde e Segurança do Trabalho. Pesquise fluxos, eventos do eSocial e regras de negócio.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Base de Conhecimento SST',
    description:
      'Respostas diretas e auditadas sobre SST e eSocial: eventos S-2210, S-2220 e S-2240, PGR, PCMSO, LTCAT e prazos legais.',
    type: 'website',
    siteName: 'Base de Conhecimento SST',
    locale: 'pt_BR',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base de Conhecimento SST',
    description:
      'Respostas diretas e auditadas sobre SST e eSocial, com procedimentos passo a passo.',
  },
};

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} ${playfair.variable} ${lexend.variable}`}
    >
      <head>
        <script
          id="theme-script"
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var isDark = localStorage.getItem('isDarkMode');
                var shouldBeDark = isDark === 'true' || (isDark === null && window.matchMedia('(prefers-color-scheme: dark)').matches);
                if (shouldBeDark) {
                  document.documentElement.classList.add('dark');
                  document.documentElement.style.colorScheme = 'dark';
                } else {
                  document.documentElement.classList.remove('dark');
                  document.documentElement.style.colorScheme = 'light';
                }
              } catch (e) { /* localStorage bloqueado (modo privado): mantém o tema padrão */ }
            `,
          }}
        />
      </head>
      <body
        className="bg-bg-main text-text-main font-sans antialiased overflow-x-hidden selection:bg-selection"
        suppressHydrationWarning
      >
        <ConsentProvider>
          <ClientLayout>{children}{modal}</ClientLayout>
        </ConsentProvider>
      </body>
    </html>
  );
}
