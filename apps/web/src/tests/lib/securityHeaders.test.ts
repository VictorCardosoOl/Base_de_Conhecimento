import { describe, it, expect } from 'vitest';
import { contentSecurityPolicy, securityHeaders } from '@/lib/security-headers';
import nextConfig from '../../../next.config';

const byKey = (isDev: boolean) => Object.fromEntries(securityHeaders(isDev).map((h) => [h.key, h.value]));

describe('securityHeaders', () => {
  it('produção: CSP sem eval, anti-framing e HSTS', () => {
    const h = byKey(false);
    expect(h['Content-Security-Policy']).toContain("frame-ancestors 'none'");
    expect(h['Content-Security-Policy']).toContain("object-src 'none'");
    expect(h['Content-Security-Policy']).toContain("form-action 'self'");
    expect(h['Content-Security-Policy']).not.toContain('unsafe-eval');
    expect(h['Content-Security-Policy']).not.toMatch(/connect-src[^;]*ws:/);
    expect(h['X-Frame-Options']).toBe('DENY');
    expect(h['X-Content-Type-Options']).toBe('nosniff');
    expect(h['Strict-Transport-Security']).toMatch(/max-age=31536000/);
  });

  it('desenvolvimento: libera eval/websocket do HMR e não envia HSTS', () => {
    const h = byKey(true);
    expect(contentSecurityPolicy(true)).toContain("'unsafe-eval'");
    expect(h['Content-Security-Policy']).toMatch(/connect-src 'self' ws: wss:/);
    expect(h['Strict-Transport-Security']).toBeUndefined();
  });

  it('next.config aplica os headers em todas as rotas e esconde X-Powered-By', async () => {
    const rules = await nextConfig.headers!();
    expect(rules).toHaveLength(1);
    expect(rules[0].source).toBe('/:path*');
    expect(rules[0].headers.map((h) => h.key)).toContain('Content-Security-Policy');
    expect(nextConfig.poweredByHeader).toBe(false);
  });
});
