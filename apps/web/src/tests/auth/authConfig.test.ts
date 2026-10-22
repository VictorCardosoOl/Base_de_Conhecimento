import { describe, it, expect } from 'vitest';
import { AuthConfigError, isAuthConfigured, parseAuthConfig } from '@/features/auth/config';

const VALID = {
  AUTH_INTERNAL_URL: 'http://localhost:8010/',
  AUTH_ISSUER: 'http://localhost:8010',
  AUTH_AUDIENCE: 'knowledge-api',
  AUTH_ACCESS_COOKIE_NAME: 'kb_at',
};

describe('parseAuthConfig', () => {
  it('normaliza a URL interna e deriva o JWKS', () => {
    expect(parseAuthConfig(VALID)).toEqual({
      internalUrl: 'http://localhost:8010',
      issuer: 'http://localhost:8010',
      audience: 'knowledge-api',
      accessCookieName: 'kb_at',
      jwksUrl: 'http://localhost:8010/.well-known/jwks.json',
    });
  });

  it('aceita JWKS explícito e cookie com prefixo __Host-', () => {
    const config = parseAuthConfig({
      ...VALID,
      AUTH_JWKS_URL: 'https://auth.empresa.com/.well-known/jwks.json',
      AUTH_ACCESS_COOKIE_NAME: '__Host-kb_at',
    });
    expect(config.jwksUrl).toBe('https://auth.empresa.com/.well-known/jwks.json');
    expect(config.accessCookieName).toBe('__Host-kb_at');
  });

  it.each(['AUTH_INTERNAL_URL', 'AUTH_ISSUER', 'AUTH_AUDIENCE', 'AUTH_ACCESS_COOKIE_NAME'])(
    'falha quando %s não está definida',
    (name) => {
      expect(() => parseAuthConfig({ ...VALID, [name]: '  ' })).toThrow(AuthConfigError);
    }
  );

  it('rejeita URL inválida ou com esquema que não é http(s)', () => {
    expect(() => parseAuthConfig({ ...VALID, AUTH_INTERNAL_URL: 'localhost:8010' })).toThrow(
      /AUTH_INTERNAL_URL/
    );
    expect(() => parseAuthConfig({ ...VALID, AUTH_INTERNAL_URL: 'ftp://auth' })).toThrow(/http/);
  });

  it('rejeita nome de cookie com caracteres inválidos', () => {
    expect(() => parseAuthConfig({ ...VALID, AUTH_ACCESS_COOKIE_NAME: 'kb at;' })).toThrow(
      /AUTH_ACCESS_COOKIE_NAME/
    );
  });

  it('integração só é considerada ligada com AUTH_INTERNAL_URL', () => {
    expect(isAuthConfigured({})).toBe(false);
    expect(isAuthConfigured({ AUTH_INTERNAL_URL: ' ' })).toBe(false);
    expect(isAuthConfigured(VALID)).toBe(true);
  });
});
