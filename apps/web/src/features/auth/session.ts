import 'server-only';

import { cookies } from 'next/headers';
import { forbidden, redirect } from 'next/navigation';
import { connection } from 'next/server';
import { createRemoteJWKSet, errors, jwtVerify, type JWTVerifyGetKey } from 'jose';
import { AuthConfigError, parseAuthConfig, type AuthConfig } from './config';
import { buildLoginRedirect, buildPasswordChangeRedirect } from './redirect';

export { buildLoginRedirect };

/**
 * Sessão no servidor.
 *
 * O access token (cookie HttpOnly) é validado localmente: assinatura EdDSA pelo JWKS
 * do AuthService, `iss`, `aud` e expiração. Isso descarta rapidamente tokens
 * inválidos. A decisão de autorização, porém, usa `GET /auth/me`: o AuthService
 * confere no banco se a sessão segue ativa e qual é o papel atual do usuário.
 * O `role` do JWT nunca é a fonte definitiva.
 */

export type Role = 'admin' | 'editor' | 'user';

/** Quem acessa o painel e o editor de artigos. */
export const CONTENT_ROLES: readonly Role[] = ['admin', 'editor'];
/** Quem gerencia usuários. */
export const USER_ADMIN_ROLES: readonly Role[] = ['admin'];

export interface AccessClaims {
  userId: string;
  sessionId: string;
  role: Role;
  expiresAt: Date;
}

export type TokenState =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'expired' }
  | { status: 'valid'; token: string; claims: AccessClaims };

export interface CurrentUser {
  id: string;
  email: string;
  /** Identificador único (minúsculas) e nome de exibição livre (ADR-0011 do AuthService). */
  username: string;
  displayName: string;
  role: Role;
  /** Senha definida por um administrador: precisa ser trocada antes de qualquer área protegida. */
  mustChangePassword: boolean;
  /** Email confirmado. Ausente se o AuthService ainda não informa (versão anterior). */
  emailVerified?: boolean;
  /** False em contas de login social sem senha (podem criar uma por "Esqueceu a senha?"). */
  hasPassword?: boolean;
}

export class AuthServiceUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthServiceUnavailableError';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: readonly Role[] = ['admin', 'editor', 'user'];

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

/** Valida o access token. Chaves desconhecidas (kid) fazem o JWKS remoto ser recarregado. */
export async function verifyAccessToken(
  token: string | undefined,
  config: Pick<AuthConfig, 'issuer' | 'audience'>,
  keySet: JWTVerifyGetKey
): Promise<TokenState> {
  if (!token) return { status: 'missing' };
  try {
    const { payload } = await jwtVerify(token, keySet, {
      issuer: config.issuer,
      audience: config.audience,
      algorithms: ['EdDSA'],
      requiredClaims: ['sub', 'sid', 'role', 'jti', 'iat', 'exp'],
    });
    if (
      typeof payload.sub !== 'string' ||
      !UUID.test(payload.sub) ||
      typeof payload.sid !== 'string' ||
      !UUID.test(payload.sid) ||
      !isRole(payload.role) ||
      typeof payload.exp !== 'number'
    ) {
      return { status: 'invalid' };
    }
    return {
      status: 'valid',
      token,
      claims: {
        userId: payload.sub,
        sessionId: payload.sid,
        role: payload.role,
        expiresAt: new Date(payload.exp * 1000),
      },
    };
  } catch (error) {
    if (error instanceof errors.JWTExpired) return { status: 'expired' };
    if (isTokenProblem(error)) return { status: 'invalid' };
    // Não é um problema do token: o JWKS não pôde ser obtido (conexão recusada,
    // timeout, resposta inesperada). Tratar como "inválido" mandaria o usuário
    // ao login como se a sessão tivesse acabado; é indisponibilidade do serviço.
    throw new AuthServiceUnavailableError('Não foi possível obter as chaves do AuthService');
  }
}

/** Erros que dizem respeito ao token apresentado (e não à disponibilidade do JWKS). */
function isTokenProblem(error: unknown): boolean {
  return (
    error instanceof errors.JWSInvalid ||
    error instanceof errors.JWTInvalid ||
    error instanceof errors.JWSSignatureVerificationFailed ||
    error instanceof errors.JWTClaimValidationFailed ||
    error instanceof errors.JWKSNoMatchingKey ||
    error instanceof errors.JWKSMultipleMatchingKeys ||
    error instanceof errors.JOSEAlgNotAllowed ||
    error instanceof errors.JOSENotSupported
  );
}

/** Confirma identidade e papel no AuthService (sessão ativa e papel atual, vindos do banco). */
export async function fetchCurrentUser(
  token: string,
  config: Pick<AuthConfig, 'internalUrl'>,
  fetchImpl: typeof fetch = fetch
): Promise<CurrentUser | null> {
  let response: Response;
  try {
    response = await fetchImpl(`${config.internalUrl}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new AuthServiceUnavailableError('AuthService indisponível');
  }
  // Lê sempre o corpo: sem isso, o fetch do Node segura a conexão com o AuthService.
  let text: string;
  try {
    text = await response.text();
  } catch {
    throw new AuthServiceUnavailableError('Resposta incompleta de /auth/me');
  }
  if (response.status === 401) return null;
  if (!response.ok) {
    throw new AuthServiceUnavailableError(`AuthService respondeu ${response.status}`);
  }
  let body: Record<string, unknown> | null;
  try {
    body = JSON.parse(text) as Record<string, unknown> | null;
  } catch {
    throw new AuthServiceUnavailableError('Resposta inesperada de /auth/me');
  }
  if (
    typeof body !== 'object' ||
    body === null ||
    typeof body.id !== 'string' ||
    typeof body.email !== 'string' ||
    typeof body.username !== 'string' ||
    typeof body.display_name !== 'string' ||
    !isRole(body.role) ||
    typeof body.must_change_password !== 'boolean'
  ) {
    throw new AuthServiceUnavailableError('Resposta inesperada de /auth/me');
  }
  return {
    id: body.id,
    email: body.email,
    username: body.username,
    displayName: body.display_name,
    role: body.role,
    mustChangePassword: body.must_change_password,
    ...(typeof body.email_verified === 'boolean' ? { emailVerified: body.email_verified } : {}),
    ...(typeof body.has_password === 'boolean' ? { hasPassword: body.has_password } : {}),
  };
}

export interface SessionDeps {
  config: AuthConfig;
  keySet: JWTVerifyGetKey;
  readAccessToken: () => Promise<string | undefined>;
  fetchImpl?: typeof fetch;
}

let remoteKeySet: { url: string; keySet: JWTVerifyGetKey } | undefined;

function getRemoteKeySet(jwksUrl: string): JWTVerifyGetKey {
  if (remoteKeySet?.url !== jwksUrl) {
    // Cache de 5 min (igual ao Cache-Control do AuthService); kid novo força recarga.
    remoteKeySet = {
      url: jwksUrl,
      keySet: createRemoteJWKSet(new URL(jwksUrl), { cacheMaxAge: 5 * 60_000 }),
    };
  }
  return remoteKeySet.keySet;
}

export function defaultSessionDeps(): SessionDeps {
  const config = parseAuthConfig();
  return {
    config,
    keySet: getRemoteKeySet(config.jwksUrl),
    readAccessToken: async () => (await cookies()).get(config.accessCookieName)?.value,
  };
}

/**
 * Dependências da sessão, lidas só em tempo de requisição. `connection()` tira a rota da
 * pré-renderização, então o build não depende das variáveis AUTH_*. Sem configuração
 * válida, a sessão fica indisponível (falha fechada): nenhuma rota protegida concede acesso.
 */
export async function loadSessionDeps(): Promise<SessionDeps> {
  await connection();
  try {
    return defaultSessionDeps();
  } catch (error) {
    if (error instanceof AuthConfigError) {
      console.error(
        `[auth] ${error.message}. Rotas protegidas ficam indisponíveis até a configuração ser corrigida.`
      );
      throw new AuthServiceUnavailableError(error.message);
    }
    throw error;
  }
}

export interface AuthenticatedSession {
  user: CurrentUser;
  /** Para chamadas server-side ao AuthService em nome do usuário. Nunca vai ao cliente. */
  accessToken: string;
}

export interface RequireOptions {
  /** Papéis aceitos; ausente = qualquer usuário autenticado. */
  roles?: readonly Role[];
  /** Só a própria página de troca de senha pode ser aberta com a troca pendente. */
  allowPendingPasswordChange?: boolean;
}

/**
 * Exige uma sessão válida, confirmada no AuthService (papel e status vêm de /auth/me,
 * nunca só do JWT). Sem sessão → /login?next=…; troca de senha pendente →
 * /conta/senha?next=…; papel fora de `roles` → 403.
 * Chamada nas páginas (não no layout), como recomenda a documentação do Next.
 */
export async function requireSession(
  nextPath: string,
  searchParams: Record<string, string | string[] | undefined> | undefined,
  options: RequireOptions = {},
  sessionDeps?: SessionDeps
): Promise<AuthenticatedSession> {
  const deps = sessionDeps ?? (await loadSessionDeps());
  const loginUrl = buildLoginRedirect(nextPath, searchParams);
  const state = await verifyAccessToken(await deps.readAccessToken(), deps.config, deps.keySet);
  if (state.status !== 'valid') redirect(loginUrl);

  const user = await fetchCurrentUser(state.token, deps.config, deps.fetchImpl);
  if (!user) redirect(loginUrl);
  // Antes do papel: com a troca pendente, nenhuma área protegida abre (nem para dar 403).
  if (user.mustChangePassword && !options.allowPendingPasswordChange) {
    redirect(buildPasswordChangeRedirect(nextPath, searchParams));
  }
  if (options.roles && !options.roles.includes(user.role)) forbidden();
  return { user, accessToken: state.token };
}

/** Atalho para páginas restritas a papéis. */
export async function requireRole(
  roles: readonly Role[],
  nextPath: string,
  searchParams?: Record<string, string | string[] | undefined>,
  deps?: SessionDeps
): Promise<AuthenticatedSession> {
  return requireSession(nextPath, searchParams, { roles }, deps);
}

/** Exige um administrador (gestão de usuários). */
export async function requireAdmin(
  nextPath: string,
  searchParams?: Record<string, string | string[] | undefined>,
  deps?: SessionDeps
): Promise<CurrentUser> {
  return (await requireRole(USER_ADMIN_ROLES, nextPath, searchParams, deps)).user;
}

export type ActionAuthorization =
  | { ok: true; session: AuthenticatedSession }
  | {
      ok: false;
      reason:
        | 'unauthenticated'
        | 'session_expired'
        | 'password_change_required'
        | 'forbidden'
        | 'unavailable';
    };

/**
 * Autorização para Server Actions: mesmas regras de requireSession, mas devolve o
 * motivo em vez de redirecionar. Server Actions são endpoints públicos: a página
 * que mostra o formulário já checou o papel, mas isso não protege a ação.
 */
export async function authorizeAction(
  roles: readonly Role[],
  sessionDeps?: SessionDeps
): Promise<ActionAuthorization> {
  try {
    const deps = sessionDeps ?? (await loadSessionDeps());
    const state = await verifyAccessToken(await deps.readAccessToken(), deps.config, deps.keySet);
    if (state.status === 'expired') return { ok: false, reason: 'session_expired' };
    if (state.status !== 'valid') return { ok: false, reason: 'unauthenticated' };

    const user = await fetchCurrentUser(state.token, deps.config, deps.fetchImpl);
    if (!user) return { ok: false, reason: 'unauthenticated' };
    if (user.mustChangePassword) return { ok: false, reason: 'password_change_required' };
    if (!roles.includes(user.role)) return { ok: false, reason: 'forbidden' };
    return { ok: true, session: { user, accessToken: state.token } };
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) return { ok: false, reason: 'unavailable' };
    throw error;
  }
}
