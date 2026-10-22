/**
 * Apresentação da conta na interface (sem dados sensíveis; usável no cliente e no servidor).
 */

/** Nome dos papéis como aparecem para as pessoas. */
export const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrador',
  editor: 'Editor',
  user: 'Leitor',
};

export function roleLabel(role: string): string {
  return ROLE_LABEL[role] ?? 'Usuário';
}

/** Iniciais para o avatar, a partir do email (ex.: maria.silva@… → "MS"). */
export function initialsFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const parts = local.split(/[._-]+/).filter(Boolean);
  const letters = (parts.length > 1 ? [parts[0][0], parts[1][0]] : [local[0]]).filter(Boolean);
  return letters.join('').toUpperCase() || '?';
}

/**
 * Destino depois de entrar/cadastrar a partir da navegação: a página atual, para voltar
 * a ela; da página inicial ou das próprias telas de acesso, a conta.
 */
export function accountEntryNext(pathname: string | null | undefined): string {
  if (!pathname || pathname === '/' || pathname.startsWith('/login') || pathname.startsWith('/cadastro')) {
    return '/conta';
  }
  return pathname;
}

export function authEntryLinks(pathname: string | null | undefined): { login: string; register: string } {
  const query = new URLSearchParams({ next: accountEntryNext(pathname) });
  return { login: `/login?${query}`, register: `/cadastro?${query}` };
}

/**
 * Mensagem do 429 com a espera informada pelo servidor (Retry-After). Acima de 60 s, em
 * minutos arredondados para cima: o limite por conta chega a 15 min ("840 s" não ajuda).
 */
export function tooManyAttemptsMessage(
  retryAfterSeconds: number | null | undefined,
  lead = 'Muitas tentativas.'
): string {
  if (!retryAfterSeconds) return `${lead} Tente novamente em instantes.`;
  const wait =
    retryAfterSeconds > 60 ? `${Math.ceil(retryAfterSeconds / 60)} min` : `${retryAfterSeconds} s`;
  return `${lead} Tente novamente em ${wait}.`;
}
