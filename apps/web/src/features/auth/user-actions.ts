import 'server-only';

import {
  CONTENT_ROLES,
  USER_ADMIN_ROLES,
  AuthServiceUnavailableError,
  authorizeAction,
  loadSessionDeps,
  type AuthenticatedSession,
  type Role,
  type SessionDeps,
} from './session';
import {
  createUser,
  decideRoleRequest,
  generateTemporaryPassword,
  resetUserPassword,
  updateUser,
  type AdminApiError,
} from './users';
import { displayNameProblem, isValidUsername, normalizeUsername } from './identity';

/**
 * Regras das Server Actions de /admin/usuarios. Cada ação:
 * 1. reautoriza no AuthService (papel e status atuais; o JWT sozinho não basta);
 * 2. valida a entrada (Server Actions são endpoints públicos);
 * 3. chama o AuthService com o token do administrador, só no servidor.
 * A senha temporária é gerada aqui e devolvida uma única vez, na resposta da ação.
 */

export type UserActionError =
  | AdminApiError
  | 'password_change_required'
  | 'self_change';

export type UserActionResult =
  | { ok: true; temporaryPassword?: string }
  | { ok: false; error: UserActionError };

export interface UserActionDeps {
  /** Ausente: lida em tempo de requisição (sem configuração, a ação fica "indisponível"). */
  session?: SessionDeps;
  generatePassword: () => string;
  fetchImpl?: typeof fetch;
}

export function defaultUserActionDeps(): UserActionDeps {
  return { generatePassword: generateTemporaryPassword };
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ROLES: readonly Role[] = ['admin', 'editor', 'user'];
// Validação completa do formato é do AuthService; aqui só o suficiente para barrar lixo.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

async function authorize(
  deps: UserActionDeps,
  roles: readonly Role[] = USER_ADMIN_ROLES
): Promise<
  | { ok: true; session: AuthenticatedSession; config: SessionDeps['config'] }
  | { ok: false; error: UserActionError }
> {
  let session: SessionDeps;
  try {
    session = deps.session ?? (await loadSessionDeps());
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) return { ok: false, error: 'unavailable' };
    throw error;
  }
  const auth = await authorizeAction(roles, session);
  return auth.ok ? { ...auth, config: session.config } : { ok: false, error: auth.reason };
}

export async function createUserAction(
  input: { email?: unknown; role?: unknown; username?: unknown; displayName?: unknown },
  deps: UserActionDeps = defaultUserActionDeps()
): Promise<UserActionResult> {
  const auth = await authorize(deps);
  if (!auth.ok) return auth;

  const email = typeof input.email === 'string' ? input.email.trim() : '';
  const username = typeof input.username === 'string' ? normalizeUsername(input.username) : '';
  const displayName = typeof input.displayName === 'string' ? input.displayName.trim() : '';
  if (
    !EMAIL.test(email) ||
    email.length > 254 ||
    !isRole(input.role) ||
    !isValidUsername(username) ||
    displayNameProblem(displayName) !== null
  ) {
    return { ok: false, error: 'invalid_input' };
  }

  const temporaryPassword = deps.generatePassword();
  const result = await createUser(
    auth.session.accessToken,
    auth.config,
    { email, role: input.role, password: temporaryPassword, username, displayName },
    deps.fetchImpl
  );
  return result.ok ? { ok: true, temporaryPassword } : { ok: false, error: result.error };
}

export async function updateUserAction(
  userId: unknown,
  changes: { role?: unknown; isActive?: unknown },
  deps: UserActionDeps = defaultUserActionDeps()
): Promise<UserActionResult> {
  const auth = await authorize(deps);
  if (!auth.ok) return auth;

  const patch: { role?: Role; is_active?: boolean } = {};
  if (changes.role !== undefined) {
    if (!isRole(changes.role)) return { ok: false, error: 'invalid_input' };
    patch.role = changes.role;
  }
  if (changes.isActive !== undefined) {
    if (typeof changes.isActive !== 'boolean') return { ok: false, error: 'invalid_input' };
    patch.is_active = changes.isActive;
  }
  if (typeof userId !== 'string' || !UUID.test(userId) || Object.keys(patch).length === 0) {
    return { ok: false, error: 'invalid_input' };
  }
  // O AuthService também recusa; checar antes dá uma mensagem precisa.
  if (userId === auth.session.user.id) return { ok: false, error: 'self_change' };

  const result = await updateUser(
    auth.session.accessToken,
    auth.config,
    userId,
    patch,
    deps.fetchImpl
  );
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}

export async function resetPasswordAction(
  userId: unknown,
  deps: UserActionDeps = defaultUserActionDeps()
): Promise<UserActionResult> {
  const auth = await authorize(deps);
  if (!auth.ok) return auth;

  if (typeof userId !== 'string' || !UUID.test(userId)) return { ok: false, error: 'invalid_input' };
  if (userId === auth.session.user.id) return { ok: false, error: 'self_change' };

  const temporaryPassword = deps.generatePassword();
  const result = await resetUserPassword(
    auth.session.accessToken,
    auth.config,
    userId,
    temporaryPassword,
    deps.fetchImpl
  );
  return result.ok ? { ok: true, temporaryPassword } : { ok: false, error: result.error };
}

/**
 * Aprova ou recusa um pedido de acesso de editor. Admin e editor podem decidir
 * (ADR-0010 do AuthService); aprovar revoga as sessões do solicitante.
 */
export async function decideRoleRequestAction(
  requestId: unknown,
  decision: unknown,
  deps: UserActionDeps = defaultUserActionDeps()
): Promise<UserActionResult> {
  const auth = await authorize(deps, CONTENT_ROLES);
  if (!auth.ok) return auth;
  if (typeof requestId !== 'string' || !UUID.test(requestId)) return { ok: false, error: 'invalid_input' };
  if (decision !== 'approve' && decision !== 'reject') return { ok: false, error: 'invalid_input' };

  const result = await decideRoleRequest(
    auth.session.accessToken,
    auth.config,
    requestId,
    decision,
    deps.fetchImpl
  );
  return result.ok ? { ok: true } : { ok: false, error: result.error };
}
