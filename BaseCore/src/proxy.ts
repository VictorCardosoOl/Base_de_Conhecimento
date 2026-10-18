import { NextResponse, type NextRequest } from 'next/server';
import { buildLoginRedirect } from '@/features/auth/redirect';

/**
 * Checagem rápida (otimista) antes de renderizar /admin e /conta: sem cookie de
 * access, vai direto para o login. NÃO é autorização. A decisão definitiva (token
 * válido, sessão ativa, papel, troca de senha pendente) acontece nas páginas,
 * via requireSession()/requireRole().
 */
export function proxy(request: NextRequest) {
  const cookieName = process.env.AUTH_ACCESS_COOKIE_NAME;
  if (!cookieName || !request.cookies.has(cookieName)) {
    const { pathname, searchParams } = request.nextUrl;
    return NextResponse.redirect(new URL(buildLoginRedirect(pathname, searchParams), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/conta', '/conta/:path*'],
};
