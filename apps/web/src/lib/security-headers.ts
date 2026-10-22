/**
 * Headers de segurança de todas as respostas do Next (páginas, /admin, estáticos).
 *
 * Antes ficavam em vercel.json e public/_headers (herança do Vite), que o `next start`
 * ignora — as páginas saíam sem nenhum deles. As respostas de /auth/* vêm do
 * AuthService, que envia a própria política (mais restrita, `default-src 'none'`).
 *
 * CSP sem nonce (guia "Without Nonces" do Next): o Next injeta scripts inline para a
 * hidratação e o layout tem o script de tema, por isso `'unsafe-inline'` em script-src.
 * Não há recursos de terceiros: fontes vêm de next/font (servidas pela própria origem).
 */
export interface SecurityHeader {
  key: string;
  value: string;
}

export function contentSecurityPolicy(isDev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self'",
    `connect-src 'self'${isDev ? ' ws: wss:' : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join('; ');
}

export function securityHeaders(isDev: boolean): SecurityHeader[] {
  const headers: SecurityHeader[] = [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(isDev) },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  ];
  if (!isDev) {
    // O navegador só honra HSTS recebido via HTTPS; em http://localhost é ignorado.
    headers.push({ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' });
  }
  return headers;
}
