import 'server-only';

import {
  AuthServiceUnavailableError,
  fetchCurrentUser,
  verifyAccessToken,
  type SessionDeps,
} from './session';

/**
 * Estado mínimo da sessão para a navegação (ex.: área de perfil do menu).
 * Sempre 200: visitante anônimo não gera erro no console. Não é autorização —
 * as páginas protegidas checam a sessão por conta própria. Responde só sobre o próprio
 * usuário (mesma origem, sem cache); devolve email, usuário e nome, nunca o token.
 */
export type SessionSummary =
  | {
      authenticated: true;
      email: string;
      username: string;
      displayName: string;
      role: string;
      mustChangePassword: boolean;
    }
  | { authenticated: false; expired?: boolean };

export async function summarizeSession(deps: SessionDeps): Promise<SessionSummary> {
  try {
    const state = await verifyAccessToken(await deps.readAccessToken(), deps.config, deps.keySet);
    if (state.status === 'expired') return { authenticated: false, expired: true };
    if (state.status !== 'valid') return { authenticated: false };
    const user = await fetchCurrentUser(state.token, deps.config, deps.fetchImpl);
    if (!user) return { authenticated: false };
    return {
      authenticated: true,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    };
  } catch (error) {
    if (error instanceof AuthServiceUnavailableError) return { authenticated: false };
    throw error;
  }
}
