/**
 * Usuário (identificador único) e nome de exibição: as mesmas regras do AuthService
 * (ADR-0011), checadas aqui para avisar enquanto a pessoa digita. Quem garante a
 * unicidade é o banco do AuthService; a consulta de disponibilidade é só uma prévia.
 */

export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 30;
export const DISPLAY_NAME_MAX_LENGTH = 100;
const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{2,29}$/;

export const USERNAME_RULES =
  'De 3 a 30 caracteres: letras sem acento, números, ponto, hífen ou sublinhado; comece com letra ou número.';

/** Forma canônica (o AuthService grava assim): sem espaços nas pontas e em minúsculas. */
export function normalizeUsername(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidUsername(value: string): boolean {
  return USERNAME_PATTERN.test(normalizeUsername(value));
}

/**
 * Nomes reservados (cópia da lista do AuthService, ADR-0012): ninguém se cadastra como
 * `admin`, `suporte` etc. Ponto, hífen e sublinhado não contam (`su.por-te` também é).
 * Aqui é só o aviso imediato; quem recusa de fato é o AuthService.
 */
export const RESERVED_USERNAMES: ReadonlySet<string> = new Set([
  'adm', 'admin', 'administrador', 'administrator', 'root', 'sudo', 'superuser', 'sistema',
  'system', 'owner', 'dono', 'suporte', 'support', 'ajuda', 'help', 'helpdesk', 'contato',
  'contact', 'equipe', 'staff', 'team', 'oficial', 'official', 'moderador', 'moderator', 'mod',
  'seguranca', 'security', 'privacidade', 'privacy', 'lgpd', 'dpo', 'encarregado', 'juridico',
  'legal', 'noreply', 'naoresponda', 'postmaster', 'webmaster', 'hostmaster', 'abuse',
  'mailerdaemon', 'info', 'api', 'auth', 'oauth', 'login', 'logout', 'cadastro', 'signup',
  'register', 'conta', 'account', 'perfil', 'profile', 'config', 'settings', 'null',
  'undefined', 'none', 'editor', 'leitor', 'usuario', 'user', 'anonimo', 'anonymous',
  'convidado', 'guest', 'teste', 'test', 'sst', 'sstfaq', 'basedeconhecimento',
]);

export function isReservedUsername(value: string): boolean {
  return RESERVED_USERNAMES.has(normalizeUsername(value).replace(/[._-]/g, ''));
}

/** Mensagem do problema no nome de exibição, ou null se está ok. */
export function displayNameProblem(value: string): string | null {
  const name = value.trim();
  if (!name) return 'Informe como você quer ser chamado.';
  if (name.length > DISPLAY_NAME_MAX_LENGTH) {
    return `O nome pode ter até ${DISPLAY_NAME_MAX_LENGTH} caracteres.`;
  }
  return null;
}

export type UsernameAvailability =
  'available' | 'taken' | 'reserved' | 'invalid' | 'rate_limited' | 'error';

/** Consulta GET /auth/username-available (proxy do Next para o AuthService). */
export async function checkUsernameAvailability(
  username: string,
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch
): Promise<UsernameAvailability> {
  const normalized = normalizeUsername(username);
  if (!isValidUsername(normalized)) return 'invalid';
  try {
    const response = await fetchImpl(
      `/auth/username-available?${new URLSearchParams({ username: normalized })}`,
      { credentials: 'same-origin', cache: 'no-store', signal }
    );
    const text = await response.text(); // lê o corpo todo (libera a conexão)
    if (response.status === 429) return 'rate_limited';
    if (!response.ok) return 'error';
    const body = JSON.parse(text) as { available?: unknown; reason?: unknown };
    if (body.available === true) return 'available';
    if (body.reason === 'taken') return 'taken';
    if (body.reason === 'reserved') return 'reserved';
    if (body.reason === 'invalid') return 'invalid';
    return 'error';
  } catch (error) {
    if (signal?.aborted) throw error;
    return 'error';
  }
}
