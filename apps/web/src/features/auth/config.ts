/**
 * Configuração da integração com o AuthService.
 *
 * Só variáveis de servidor (sem prefixo NEXT_PUBLIC_): o navegador nunca conhece
 * o endereço interno do AuthService; ele fala com /auth/* na própria origem do Next,
 * que repassa para o serviço (rewrite em next.config.ts).
 */

export interface AuthConfig {
  /** URL interna do AuthService, sem barra final (ex.: http://localhost:8010). */
  internalUrl: string;
  /** Valor esperado na claim `iss` dos access tokens. */
  issuer: string;
  /** Valor esperado na claim `aud` dos access tokens. */
  audience: string;
  /** Nome do cookie HttpOnly do access token (kb_at em HTTP local, __Host-kb_at em produção). */
  accessCookieName: string;
  /** Endereço do JWKS usado para validar os tokens com a chave pública. */
  jwksUrl: string;
}

type Env = Record<string, string | undefined>;

export class AuthConfigError extends Error {
  constructor(message: string) {
    super(`Configuração de autenticação inválida: ${message}`);
    this.name = 'AuthConfigError';
  }
}

function httpUrl(name: string, value: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new AuthConfigError(`${name} não é uma URL válida`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new AuthConfigError(`${name} deve usar http ou https`);
  }
  return value.replace(/\/+$/, '');
}

function required(env: Env, name: string): string {
  const value = env[name]?.trim();
  if (!value) throw new AuthConfigError(`${name} não definida`);
  return value;
}

/** Integração ligada somente quando AUTH_INTERNAL_URL está definida. */
export function isAuthConfigured(env: Env = process.env): boolean {
  return Boolean(env.AUTH_INTERNAL_URL?.trim());
}

export function parseAuthConfig(env: Env = process.env): AuthConfig {
  const internalUrl = httpUrl('AUTH_INTERNAL_URL', required(env, 'AUTH_INTERNAL_URL'));
  const jwksUrl = env.AUTH_JWKS_URL?.trim()
    ? httpUrl('AUTH_JWKS_URL', env.AUTH_JWKS_URL.trim())
    : `${internalUrl}/.well-known/jwks.json`;

  const accessCookieName = required(env, 'AUTH_ACCESS_COOKIE_NAME');
  if (!/^[A-Za-z0-9_-]+$/.test(accessCookieName)) {
    throw new AuthConfigError('AUTH_ACCESS_COOKIE_NAME contém caracteres inválidos');
  }

  return {
    internalUrl,
    issuer: required(env, 'AUTH_ISSUER'),
    audience: required(env, 'AUTH_AUDIENCE'),
    accessCookieName,
    jwksUrl,
  };
}
