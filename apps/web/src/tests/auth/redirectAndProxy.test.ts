// @vitest-environment node
import { describe, it, expect, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { buildLoginRedirect } from '@/features/auth/redirect';
import { proxy, config } from '@/proxy';

describe('buildLoginRedirect', () => {
  it('preserva caminho e query em next', () => {
    expect(buildLoginRedirect('/admin/editor', new URLSearchParams('id=pgr'))).toBe(
      '/login?next=%2Fadmin%2Feditor%3Fid%3Dpgr'
    );
  });

  it('não permite open redirect', () => {
    expect(buildLoginRedirect('https://evil.example/admin')).toBe('/login?next=%2F');
    expect(buildLoginRedirect('//evil.example')).toBe('/login?next=%2F');
  });
});

describe('proxy (checagem rápida, não é autorização)', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('só intercepta as áreas protegidas (/admin e /conta)', () => {
    expect(config.matcher).toEqual(['/admin', '/admin/:path*', '/conta', '/conta/:path*']);
  });

  it('sem cookie de access → redireciona para o login com next', () => {
    vi.stubEnv('AUTH_ACCESS_COOKIE_NAME', 'kb_at');
    const response = proxy(new NextRequest('http://localhost:3000/admin/editor?id=pgr'));
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'http://localhost:3000/login?next=%2Fadmin%2Feditor%3Fid%3Dpgr'
    );
  });

  it('com cookie → segue para a página, que faz a autorização definitiva', () => {
    vi.stubEnv('AUTH_ACCESS_COOKIE_NAME', 'kb_at');
    const request = new NextRequest('http://localhost:3000/admin', {
      headers: { cookie: 'kb_at=qualquer-valor' },
    });
    const response = proxy(request);
    expect(response.headers.get('x-middleware-next')).toBe('1');
    expect(response.headers.get('location')).toBeNull();
  });

  it('sem configuração de autenticação → falha fechada (login)', () => {
    vi.stubEnv('AUTH_ACCESS_COOKIE_NAME', '');
    const request = new NextRequest('http://localhost:3000/admin', {
      headers: { cookie: 'kb_at=x' },
    });
    expect(proxy(request).status).toBe(307);
  });
});
