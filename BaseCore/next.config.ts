import type { NextConfig } from 'next';
import { isAuthConfigured, parseAuthConfig } from './src/features/auth/config';
import { securityHeaders } from './src/lib/security-headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // `postcss` (dependência do sanitize-html) está na lista padrão de pacotes
  // externos do servidor, que o Turbopack liga via junction em .next/node_modules.
  // Empacotá-lo evita a junction, que falha em volumes sem suporte (ex.: FAT32).
  transpilePackages: ['postcss'],
  // Habilita forbidden(): a única forma do App Router responder 403 numa página.
  // É experimental no Next 16; a decisão está registrada em docs/INTEGRACAO_AUTH.md.
  experimental: {
    authInterrupts: true,
  },

  // O navegador fala só com a origem do Next: /auth/* é repassado ao AuthService.
  // Mesma origem = cookies first-party e nenhum CORS. /admin/* NÃO é repassado:
  // são páginas da própria Base de Conhecimento.
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    return [{ source: '/:path*', headers: securityHeaders(isDev) }];
  },

  async rewrites() {
    if (!isAuthConfigured()) return [];
    const { internalUrl } = parseAuthConfig();
    return [
      { source: '/auth/:path*', destination: `${internalUrl}/auth/:path*` },
      // Avaliações, sugestões de correção e comentários (ADR-0015 do AuthService).
      { source: '/content/:path*', destination: `${internalUrl}/content/:path*` },
    ];
  },
};

export default nextConfig;
