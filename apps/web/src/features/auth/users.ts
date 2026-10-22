import 'server-only';

import type { AuthConfig } from './config';
import type { Role } from './session';

/**
 * Chamadas à API administrativa do AuthService (/admin/users), feitas só no servidor
 * do Next com o access token do administrador (Bearer). O navegador nunca fala com
 * essas rotas: elas não passam pelo proxy /auth/*.
 */

export interface ManagedUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export interface UserPage {
  items: ManagedUser[];
  total: number;
  limit: number;
  offset: number;
}

export type AdminApiError =
  | 'session_expired'
  | 'unauthenticated'
  | 'forbidden'
  | 'not_found'
  | 'email_taken'
  | 'username_taken'
  | 'last_admin'
  | 'already_decided'
  | 'invalid_input'
  | 'unavailable';

export type AdminApiResult<T> = { ok: true; value: T } | { ok: false; error: AdminApiError };

type Config = Pick<AuthConfig, 'internalUrl'>;

const ROLES: readonly Role[] = ['admin', 'editor', 'user'];

/** Resposta já lida por inteiro (corpo sem ler prende a conexão do fetch do Node). */
interface Reply {
  status: number;
  ok: boolean;
  body: unknown;
}

function errorCodeOf(reply: Reply): string | null {
  const code = (reply.body as { error?: { code?: unknown } } | null)?.error?.code;
  return typeof code === 'string' ? code : null;
}

/** Campo apontado por um 409 do AuthService (`details[0].field`). */
function conflictField(reply: Reply): string | null {
  const details = (reply.body as { error?: { details?: unknown } } | null)?.error?.details;
  const field = Array.isArray(details) ? (details[0] as { field?: unknown } | null)?.field : null;
  return typeof field === 'string' ? field : null;
}

function failure(reply: Reply, conflict: AdminApiError): AdminApiError {
  switch (reply.status) {
    case 400:
      return 'invalid_input';
    case 401:
      return errorCodeOf(reply) === 'SESSION_EXPIRED' ? 'session_expired' : 'unauthenticated';
    case 403:
      return 'forbidden';
    case 404:
      return 'not_found';
    case 409:
      return conflict;
    default:
      return 'unavailable';
  }
}

async function call(
  config: Config,
  token: string,
  path: string,
  init: RequestInit,
  fetchImpl: typeof fetch
): Promise<Reply | null> {
  try {
    const response = await fetchImpl(`${config.internalUrl}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/json',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    });
    const text = await response.text();
    let body: unknown = null;
    if (text) {
      try {
        body = JSON.parse(text);
      } catch {
        body = undefined; // corpo que não é JSON: fora do contrato
      }
    }
    return { status: response.status, ok: response.ok, body };
  } catch {
    return null;
  }
}

function toManagedUser(raw: unknown): ManagedUser | null {
  const u = raw as Record<string, unknown> | null;
  if (
    typeof u !== 'object' ||
    u === null ||
    typeof u.id !== 'string' ||
    typeof u.email !== 'string' ||
    typeof u.username !== 'string' ||
    typeof u.display_name !== 'string' ||
    typeof u.role !== 'string' ||
    !(ROLES as readonly string[]).includes(u.role) ||
    typeof u.is_active !== 'boolean' ||
    typeof u.must_change_password !== 'boolean' ||
    typeof u.created_at !== 'string' ||
    !(u.last_login_at === null || typeof u.last_login_at === 'string')
  ) {
    return null;
  }
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.display_name,
    role: u.role as Role,
    isActive: u.is_active,
    mustChangePassword: u.must_change_password,
    createdAt: u.created_at,
    lastLoginAt: u.last_login_at,
  };
}

export async function listUsers(
  token: string,
  config: Config,
  page: { limit: number; offset: number; query?: string },
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<UserPage>> {
  const query = new URLSearchParams({ limit: String(page.limit), offset: String(page.offset) });
  // Busca em usuário, nome e email (feita pelo AuthService).
  const term = page.query?.trim();
  if (term) query.set('q', term);
  const response = await call(config, token, `/admin/users?${query}`, { method: 'GET' }, fetchImpl);
  if (!response) return { ok: false, error: 'unavailable' };
  if (!response.ok) return { ok: false, error: failure(response, 'unavailable') };

  const body = (response.body) as Record<string, unknown> | null;
  const rawItems = Array.isArray(body?.items) ? body.items : null;
  const items = rawItems?.map(toManagedUser);
  if (!body || !items || items.some((item) => item === null) || typeof body.total !== 'number') {
    return { ok: false, error: 'unavailable' };
  }
  return {
    ok: true,
    value: {
      items: items as ManagedUser[],
      total: body.total,
      limit: page.limit,
      offset: page.offset,
    },
  };
}

export async function createUser(
  token: string,
  config: Config,
  input: { email: string; role: Role; password: string; username: string; displayName: string },
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<ManagedUser>> {
  const body = {
    email: input.email,
    role: input.role,
    password: input.password,
    username: input.username,
    display_name: input.displayName,
  };
  const response = await call(
    config,
    token,
    '/admin/users',
    { method: 'POST', body: JSON.stringify(body) },
    fetchImpl
  );
  if (!response) return { ok: false, error: 'unavailable' };
  if (response.status !== 201) {
    const conflict = conflictField(response) === 'username' ? 'username_taken' : 'email_taken';
    return { ok: false, error: failure(response, conflict) };
  }
  const user = toManagedUser(response.body);
  return user ? { ok: true, value: user } : { ok: false, error: 'unavailable' };
}

export async function updateUser(
  token: string,
  config: Config,
  userId: string,
  changes: { role?: Role; is_active?: boolean },
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<ManagedUser>> {
  const response = await call(
    config,
    token,
    `/admin/users/${encodeURIComponent(userId)}`,
    { method: 'PATCH', body: JSON.stringify(changes) },
    fetchImpl
  );
  if (!response) return { ok: false, error: 'unavailable' };
  if (!response.ok) return { ok: false, error: failure(response, 'last_admin') };
  const user = toManagedUser(response.body);
  return user ? { ok: true, value: user } : { ok: false, error: 'unavailable' };
}

export async function resetUserPassword(
  token: string,
  config: Config,
  userId: string,
  password: string,
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<null>> {
  const response = await call(
    config,
    token,
    `/admin/users/${encodeURIComponent(userId)}/password`,
    { method: 'POST', body: JSON.stringify({ password }) },
    fetchImpl
  );
  if (!response) return { ok: false, error: 'unavailable' };
  if (response.status !== 204) return { ok: false, error: failure(response, 'unavailable') };
  return { ok: true, value: null };
}

// ── Pedidos de acesso de editor (ADR-0010 do AuthService) ─────────────────

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected';

export interface OwnRoleRequest {
  status: RoleRequestStatus;
  createdAt: string;
  decidedAt: string | null;
}

export interface PendingRoleRequest {
  id: string;
  userId: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: string;
}

const STATUSES: readonly string[] = ['pending', 'approved', 'rejected'];

/** Situação do último pedido do próprio usuário (null = nunca pediu). */
export async function getOwnRoleRequest(
  token: string,
  config: Config,
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<OwnRoleRequest | null>> {
  const response = await call(config, token, '/auth/role-request', { method: 'GET' }, fetchImpl);
  if (!response) return { ok: false, error: 'unavailable' };
  if (!response.ok) return { ok: false, error: failure(response, 'unavailable') };
  const body = (response.body) as Record<string, unknown> | null | undefined;
  if (body === null) return { ok: true, value: null };
  if (
    typeof body !== 'object' ||
    typeof body.status !== 'string' ||
    !STATUSES.includes(body.status) ||
    typeof body.created_at !== 'string' ||
    !(body.decided_at === null || typeof body.decided_at === 'string')
  ) {
    return { ok: false, error: 'unavailable' };
  }
  return {
    ok: true,
    value: {
      status: body.status as RoleRequestStatus,
      createdAt: body.created_at,
      decidedAt: body.decided_at,
    },
  };
}

export async function listRoleRequests(
  token: string,
  config: Config,
  page: { limit: number; offset: number },
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<{ items: PendingRoleRequest[]; total: number }>> {
  const query = new URLSearchParams({ limit: String(page.limit), offset: String(page.offset) });
  const response = await call(config, token, `/admin/role-requests?${query}`, { method: 'GET' }, fetchImpl);
  if (!response) return { ok: false, error: 'unavailable' };
  if (!response.ok) return { ok: false, error: failure(response, 'unavailable') };

  const body = (response.body) as Record<string, unknown> | null;
  const raw = Array.isArray(body?.items) ? (body.items as Record<string, unknown>[]) : null;
  if (!body || !raw || typeof body.total !== 'number') return { ok: false, error: 'unavailable' };
  const items: PendingRoleRequest[] = [];
  for (const item of raw) {
    if (
      typeof item?.id !== 'string' ||
      typeof item.user_id !== 'string' ||
      typeof item.email !== 'string' ||
      typeof item.username !== 'string' ||
      typeof item.display_name !== 'string' ||
      typeof item.created_at !== 'string'
    ) {
      return { ok: false, error: 'unavailable' };
    }
    items.push({
      id: item.id,
      userId: item.user_id,
      email: item.email,
      username: item.username,
      displayName: item.display_name,
      createdAt: item.created_at,
    });
  }
  return { ok: true, value: { items, total: body.total } };
}

export async function decideRoleRequest(
  token: string,
  config: Config,
  requestId: string,
  decision: 'approve' | 'reject',
  fetchImpl: typeof fetch = fetch
): Promise<AdminApiResult<null>> {
  const response = await call(
    config,
    token,
    `/admin/role-requests/${encodeURIComponent(requestId)}/${decision}`,
    { method: 'POST' },
    fetchImpl
  );
  if (!response) return { ok: false, error: 'unavailable' };
  if (!response.ok) return { ok: false, error: failure(response, 'already_decided') };
  return { ok: true, value: null };
}

// Sem caracteres ambíguos (0/O, 1/l/I) para quem precisa ditar ou digitar a senha.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

/**
 * Senha temporária gerada no servidor: 16 símbolos de 57 (~93 bits), em grupos de 4
 * para facilitar a leitura (19 caracteres). Amostragem por rejeição, sem viés de módulo.
 */
export function generateTemporaryPassword(
  random: (bytes: Uint8Array) => Uint8Array = (bytes) => crypto.getRandomValues(bytes)
): string {
  const limit = 256 - (256 % ALPHABET.length);
  const chars: string[] = [];
  while (chars.length < 16) {
    for (const byte of random(new Uint8Array(32))) {
      if (byte < limit && chars.length < 16) chars.push(ALPHABET[byte % ALPHABET.length]);
    }
  }
  return [0, 4, 8, 12].map((start) => chars.slice(start, start + 4).join('')).join('-');
}
