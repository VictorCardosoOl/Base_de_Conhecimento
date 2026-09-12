import "@/assets/styles/global.css";
import { Metadata } from "next";
import { ClientLayout } from "./ClientLayout";
import { ConsentProvider } from "@/contexts/ConsentContext";

import { Inter, Playfair_Display, Lexend } from "next/font/google";
import { Viewport } from "next";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-lexend", display: "swap" });

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "Base de Conhecimento SST | Padrão eSocial",
  description: "Guias oficiais, diretrizes e procedimentos consolidados de Saúde e Segurança do Trabalho. Pesquise fluxos, eventos do eSocial e regras de negócio.",
  openGraph: {
    title: "Base de Conhecimento SST",
    description: "Guias e procedimentos consolidados de SST e eSocial.",
    type: "website",
    siteName: "Base de Conhecimento SST",
  },
  twitter: {
    card: "summary_large_image",
    title: "Base de Conhecimento SST",
    description: "Guias e procedimentos de SST",
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${lexend.variable}`}>
      <body className="bg-bg-main text-text-main font-sans antialiased overflow-x-hidden selection:bg-selection" suppressHydrationWarning>
        <ConsentProvider>
            <ClientLayout>{children}</ClientLayout>
        </ConsentProvider>
      </body>
    </html>
  );
}
