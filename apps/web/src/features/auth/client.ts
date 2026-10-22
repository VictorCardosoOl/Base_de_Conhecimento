/**
 * Autenticação no navegador.
 *
 * Os tokens vivem em cookies HttpOnly definidos pelo AuthService (via proxy /auth/*):
 * este módulo nunca lê, guarda nem expõe tokens. Ele só chama os endpoints de
 * autenticação na própria origem e interpreta as respostas do contrato.
 */

export type Role = 'admin' | 'editor' | 'user';

export interface SessionUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  role: Role;
  must_change_password: boolean;
  /** Email confirmado (link, redefinição de senha ou provedor social). */
  email_verified?: boolean;
  /** False em contas de login social que ainda não criaram senha. */
  has_password?: boolean;
}

export type LoginResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: 'invalid_credentials' }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null }
  | { ok: false; reason: 'validation' }
  | { ok: false; reason: 'unavailable' };

const JSON_HEADERS = { 'Content-Type': 'application/json', Accept: 'application/json' };

interface AuthReply {
  status: number;
  ok: boolean;
  headers: Headers;
  body: unknown;
}

/**
 * Lê SEMPRE o corpo inteiro da resposta. Com o corpo sem ler, o navegador não dá a
 * requisição por encerrada e segura a conexão (limitada por servidor), atrasando as
 * próximas. As respostas de autenticação são pequenas (JSON de poucos bytes).
 */
async function readReply(response: Response): Promise<AuthReply> {
  let text = '';
  try {
    text = await response.text();
  } catch {
    // corpo indisponível: segue só com status e cabeçalhos
  }
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  return { status: response.status, ok: response.ok, headers: response.headers, body };
}

function errorCodeOf(reply: AuthReply): string | null {
  const code = (reply.body as { error?: { code?: unknown } } | null)?.error?.code;
  return typeof code === 'string' ? code : null;
}

/** Campo apontado por um 409/400 do AuthService (`details[0].field`: email, username...). */
export function conflictFieldOf(body: unknown): string | null {
  const details = (body as { error?: { details?: unknown } } | null)?.error?.details;
  const field = Array.isArray(details) ? (details[0] as { field?: unknown } | null)?.field : null;
  return typeof field === 'string' ? field : null;
}

async function send(input: string, init: RequestInit): Promise<AuthReply> {
  return readReply(await fetch(input, { credentials: 'same-origin', ...init }));
}

/** Como `send`, mas com access expirado (401 SESSION_EXPIRED) renova uma vez e repete. */
async function sendAuthenticated(input: string, init: RequestInit): Promise<AuthReply> {
  const first = await send(input, init);
  if (first.status !== 401 || errorCodeOf(first) !== 'SESSION_EXPIRED') return first;
  return (await refreshSession()) ? send(input, init) : first;
}

export async function login(email: string, password: string): Promise<LoginResult> {
  let reply: AuthReply;
  try {
    reply = await send('/auth/login', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email, password }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (reply.ok) return { ok: true, user: (reply.body as { user: SessionUser }).user };
  if (reply.status === 401) return { ok: false, reason: 'invalid_credentials' };
  if (reply.status === 429) {
    return { ok: false, reason: 'rate_limited', retryAfterSeconds: retryAfterSeconds(reply) };
  }
  if (reply.status === 400) return { ok: false, reason: 'validation' };
  return { ok: false, reason: 'unavailable' };
}

export const PASSWORD_MIN_LENGTH = 12;
export const PASSWORD_MAX_LENGTH = 256;

export type ChangePasswordResult =
  | { ok: true }
  | { ok: false; reason: 'wrong_current' | 'validation' | 'unauthenticated' | 'unavailable' }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null };

function retryAfterSeconds(reply: AuthReply): number | null {
  const value = Number(reply.headers.get('Retry-After'));
  return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Troca a própria senha (POST /auth/password). A sessão atual continua válida; as
 * demais sessões do usuário são encerradas pelo AuthService.
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<ChangePasswordResult> {
  let reply: AuthReply;
  try {
    reply = await sendAuthenticated('/auth/password', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (reply.ok) return { ok: true };
  if (reply.status === 401) return { ok: false, reason: 'unauthenticated' };
  if (reply.status === 429) {
    return { ok: false, reason: 'rate_limited', retryAfterSeconds: retryAfterSeconds(reply) };
  }
  if (reply.status === 400) {
    // Com `details`: a nova senha violou a política. Sem: regra de negócio — a igualdade
    // com a atual é barrada antes do envio, então resta a senha atual incorreta.
    const body = reply.body as { error?: { details?: unknown } } | null;
    const hasDetails = body === null || (Array.isArray(body.error?.details) && body.error.details.length > 0);
    return { ok: false, reason: hasDetails ? 'validation' : 'wrong_current' };
  }
  return { ok: false, reason: 'unavailable' };
}

let refreshInFlight: Promise<boolean> | null = null;

/**
 * Renova a sessão com o cookie de refresh (Path=/auth). Chamadas simultâneas na
 * mesma aba compartilham uma única requisição: o refresh token é rotativo, e
 * duas renovações paralelas desperdiçariam a janela de tolerância do AuthService.
 */
export function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = send('/auth/refresh', {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
      .then((reply) => reply.ok)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

export type ProfessionalArea =
  | 'seguranca_trabalho'
  | 'saude_ocupacional'
  | 'rh_dp'
  | 'contabil_financeiro'
  | 'juridico'
  | 'ti'
  | 'gestao'
  | 'outra';

/** Aceite dos termos (versões lidas) e perfil complementar opcional (ADR-0014). */
export interface TermsAndProfile {
  acceptTerms: boolean;
  termsVersion: string;
  privacyVersion: string;
  organization?: string;
  professionalArea?: ProfessionalArea | '';
}

type SignupFailureReason =
  | 'email_taken'
  | 'username_taken'
  | 'username_reserved'
  | 'terms_outdated'
  | 'validation'
  | 'disabled'
  | 'unavailable';

export type RegisterResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: SignupFailureReason }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null };

function termsAndProfileBody(input: TermsAndProfile) {
  return {
    accept_terms: input.acceptTerms,
    terms_version: input.termsVersion,
    privacy_version: input.privacyVersion,
    organization: input.organization?.trim() || null,
    professional_area: input.professionalArea || null,
  };
}

/** Interpreta as falhas comuns aos dois cadastros (com senha e por login social). */
function signupFailure(reply: AuthReply): Exclude<RegisterResult, { ok: true }> {
  if (reply.status === 409) {
    const field = conflictFieldOf(reply.body);
    return { ok: false, reason: field === 'username' ? 'username_taken' : 'email_taken' };
  }
  if (reply.status === 400) {
    const field = conflictFieldOf(reply.body);
    if (field === 'username' && errorCodeOf(reply) === 'VALIDATION_ERROR') {
      // Formato inválido é barrado antes do envio; o que sobra do AuthService é o reservado.
      return { ok: false, reason: 'username_reserved' };
    }
    if (field === 'terms_version' || field === 'privacy_version') {
      return { ok: false, reason: 'terms_outdated' };
    }
    return { ok: false, reason: 'validation' };
  }
  if (reply.status === 404) return { ok: false, reason: 'disabled' };
  if (reply.status === 429) {
    return { ok: false, reason: 'rate_limited', retryAfterSeconds: retryAfterSeconds(reply) };
  }
  return { ok: false, reason: 'unavailable' };
}

/**
 * Cadastro público (POST /auth/register). A conta nasce sempre como leitor (`user`):
 * o papel não é enviado. O AuthService já abre a sessão (cookies HttpOnly) e envia o
 * link de confirmação do email.
 */
export async function register(
  input: {
    email: string;
    password: string;
    username: string;
    displayName: string;
  } & TermsAndProfile
): Promise<RegisterResult> {
  let reply: AuthReply;
  try {
    reply = await send('/auth/register', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        email: input.email,
        password: input.password,
        username: input.username,
        display_name: input.displayName,
        ...termsAndProfileBody(input),
      }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }

  if (reply.status === 201) return { ok: true, user: (reply.body as { user: SessionUser }).user };
  return signupFailure(reply);
}

// ── Esqueci a senha e confirmação de email (ADR-0012 do AuthService) ─────────

export type ForgotPasswordResult =
  | { ok: true }
  | { ok: false; reason: 'validation' | 'unavailable' }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null };

/**
 * Pede o link de redefinição (POST /auth/password/forgot). A resposta é a mesma exista
 * ou não a conta: a tela nunca diz se o email está cadastrado.
 */
export async function requestPasswordReset(email: string): Promise<ForgotPasswordResult> {
  let reply: AuthReply;
  try {
    reply = await send('/auth/password/forgot', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ email }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (reply.status === 202) return { ok: true };
  if (reply.status === 400) return { ok: false, reason: 'validation' };
  if (reply.status === 429) {
    return { ok: false, reason: 'rate_limited', retryAfterSeconds: retryAfterSeconds(reply) };
  }
  return { ok: false, reason: 'unavailable' };
}

export type TokenActionResult =
  | { ok: true }
  | { ok: false; reason: 'invalid_token' | 'validation' | 'unavailable' }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null };

function tokenActionFailure(reply: AuthReply): Exclude<TokenActionResult, { ok: true }> {
  if (reply.status === 400) {
    return {
      ok: false,
      reason: errorCodeOf(reply) === 'INVALID_TOKEN' ? 'invalid_token' : 'validation',
    };
  }
  if (reply.status === 429) {
    return { ok: false, reason: 'rate_limited', retryAfterSeconds: retryAfterSeconds(reply) };
  }
  return { ok: false, reason: 'unavailable' };
}

/** Define a nova senha com o token do link (POST /auth/password/reset). Uso único. */
export async function resetPassword(token: string, newPassword: string): Promise<TokenActionResult> {
  try {
    const reply = await send('/auth/password/reset', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ token, new_password: newPassword }),
    });
    return reply.status === 204 ? { ok: true } : tokenActionFailure(reply);
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

/** Confirma o email com o token do link (POST /auth/email/verify). */
export async function verifyEmail(token: string): Promise<TokenActionResult> {
  try {
    const reply = await send('/auth/email/verify', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({ token }),
    });
    return reply.status === 204 ? { ok: true } : tokenActionFailure(reply);
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
}

export type ResendVerificationResult =
  | { ok: true }
  | { ok: false; reason: 'unauthenticated' | 'unavailable' }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null };

/** Reenvia o link de confirmação do email (POST /auth/email/verification, com sessão). */
export async function resendEmailVerification(): Promise<ResendVerificationResult> {
  let reply: AuthReply;
  try {
    reply = await sendAuthenticated('/auth/email/verification', {
      method: 'POST',
      headers: JSON_HEADERS,
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (reply.status === 202) return { ok: true };
  if (reply.status === 401) return { ok: false, reason: 'unauthenticated' };
  if (reply.status === 429) {
    return { ok: false, reason: 'rate_limited', retryAfterSeconds: retryAfterSeconds(reply) };
  }
  return { ok: false, reason: 'unavailable' };
}

// ── Login social (ADR-0013 do AuthService) ───────────────────────────────────

export interface SocialProvider {
  id: string;
  name: string;
}

const PROVIDER_ID = /^[a-z][a-z0-9-]{1,29}$/;

/** Provedores configurados no AuthService (GET /auth/oauth/providers). */
export async function fetchSocialProviders(): Promise<SocialProvider[] | null> {
  try {
    const reply = await send('/auth/oauth/providers', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
    if (!reply.ok) return null;
    const providers = (reply.body as { providers?: unknown } | null)?.providers;
    if (!Array.isArray(providers)) return null;
    return providers.filter(
      (item): item is SocialProvider =>
        typeof item?.id === 'string' && PROVIDER_ID.test(item.id) && typeof item?.name === 'string'
    );
  } catch {
    return null;
  }
}

/** Endereço que inicia o login social (navegação completa; o AuthService redireciona). */
export function socialLoginHref(providerId: string, next: string): string {
  return `/auth/oauth/${encodeURIComponent(providerId)}/start?${new URLSearchParams({ next })}`;
}

export interface PendingSocialSignup {
  provider: string;
  providerName: string;
  email: string;
  suggestedDisplayName: string | null;
  suggestedUsername: string | null;
}

export type PendingSocialSignupResult =
  | { ok: true; pending: PendingSocialSignup }
  | { ok: false; reason: 'none' | 'unavailable' };

/** Cadastro social aguardando usuário, nome e termos (GET /auth/oauth/pending). */
export async function fetchPendingSocialSignup(): Promise<PendingSocialSignupResult> {
  let reply: AuthReply;
  try {
    reply = await send('/auth/oauth/pending', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (reply.status === 400) return { ok: false, reason: 'none' };
  const body = reply.body as Record<string, unknown> | null;
  if (!reply.ok || !body || typeof body.email !== 'string' || typeof body.provider !== 'string') {
    return { ok: false, reason: 'unavailable' };
  }
  const text = (value: unknown) => (typeof value === 'string' && value ? value : null);
  return {
    ok: true,
    pending: {
      provider: body.provider,
      providerName: text(body.provider_name) ?? body.provider,
      email: body.email,
      suggestedDisplayName: text(body.suggested_display_name),
      suggestedUsername: text(body.suggested_username),
    },
  };
}

export type SocialSignupResult =
  | { ok: true; user: SessionUser; nextPath: string }
  | { ok: false; reason: SignupFailureReason | 'expired' }
  | { ok: false; reason: 'rate_limited'; retryAfterSeconds: number | null };

/** Conclui o cadastro social (POST /auth/oauth/complete); o AuthService abre a sessão. */
export async function completeSocialSignup(
  input: { username: string; displayName: string } & TermsAndProfile
): Promise<SocialSignupResult> {
  let reply: AuthReply;
  try {
    reply = await send('/auth/oauth/complete', {
      method: 'POST',
      headers: JSON_HEADERS,
      body: JSON.stringify({
        username: input.username,
        display_name: input.displayName,
        ...termsAndProfileBody(input),
      }),
    });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (reply.status === 201) {
    const body = reply.body as { user: SessionUser; next_path?: unknown };
    return {
      ok: true,
      user: body.user,
      nextPath: typeof body.next_path === 'string' ? body.next_path : '/conta',
    };
  }
  if (reply.status === 400 && errorCodeOf(reply) === 'INVALID_TOKEN') {
    return { ok: false, reason: 'expired' };
  }
  return signupFailure(reply);
}

/** Desiste do cadastro social pendente (apaga o registro e o cookie). */
export async function cancelSocialSignup(): Promise<void> {
  try {
    await send('/auth/oauth/pending/cancel', { method: 'POST', headers: JSON_HEADERS });
  } catch {
    // sem rede: o cadastro pendente vence sozinho em poucos minutos
  }
}

export type RoleRequestResult =
  | { ok: true }
  | { ok: false; reason: 'already_pending' | 'not_eligible' | 'unauthenticated' | 'unavailable' };

/** Pede acesso de editor (POST /auth/role-request). Um admin ou editor decide. */
export async function requestEditorAccess(): Promise<RoleRequestResult> {
  let reply: AuthReply;
  try {
    reply = await sendAuthenticated('/auth/role-request', { method: 'POST', headers: JSON_HEADERS });
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
  if (reply.status === 201) return { ok: true };
  if (reply.status === 409) return { ok: false, reason: 'already_pending' };
  if (reply.status === 400) return { ok: false, reason: 'not_eligible' };
  if (reply.status === 401) return { ok: false, reason: 'unauthenticated' };
  return { ok: false, reason: 'unavailable' };
}

/**
 * Encerra a sessão no AuthService, que revoga o refresh token e limpa os cookies.
 * Os cookies são HttpOnly: o navegador não consegue apagá-los sozinho. Por isso uma
 * falha aqui precisa chegar à tela — do contrário o usuário "sai", mas a sessão
 * continua válida e é retomada no próximo acesso ao login.
 * 401 também conta como sucesso: não há sessão para encerrar.
 */
export async function logout(): Promise<boolean> {
  try {
    const reply = await send('/auth/logout', { method: 'POST' });
    return reply.ok || reply.status === 401;
  } catch {
    return false;
  }
}

/**
 * Encerra todas as sessões da conta (todos os navegadores e dispositivos), inclusive esta.
 * Serve para quando a pessoa suspeita que alguém entrou na conta. Renova o access token
 * uma vez se preciso (a rota exige sessão); 401 sem sessão conta como encerrada.
 */
export async function logoutAll(): Promise<boolean> {
  try {
    const reply = await sendAuthenticated('/auth/logout-all', { method: 'POST' });
    return reply.ok || reply.status === 401;
  } catch {
    return false;
  }
}

/**
 * fetch para chamadas autenticadas a outras APIs: se o access token expirou
 * (401 SESSION_EXPIRED), renova uma única vez e repete a requisição. Nunca entra em
 * loop. Quem chama recebe a Response e deve consumir o corpo.
 */
export async function authFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const request = () => fetch(input, { credentials: 'same-origin', ...init });
  const response = await request();
  if (response.status !== 401) return response;
  const reply = await readReply(response.clone());
  if (errorCodeOf(reply) !== 'SESSION_EXPIRED') return response;
  await response.body?.cancel().catch(() => undefined); // descartada: vamos repetir
  return (await refreshSession()) ? request() : response;
}
