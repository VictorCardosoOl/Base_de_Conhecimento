/** Caminho + query atuais, para voltar a eles depois do login ou da troca de senha. */
function buildReturnTarget(
  path: string,
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): string {
  const safePath = path.startsWith('/') && !path.startsWith('//') ? path : '/';
  const query = new URLSearchParams();
  const entries =
    searchParams instanceof URLSearchParams
      ? Array.from(searchParams.entries())
      : Object.entries(searchParams ?? {}).flatMap(([key, value]) =>
          (Array.isArray(value) ? value : value === undefined ? [] : [value]).map(
            (item): [string, string] => [key, item]
          )
        );
  for (const [key, value] of entries) query.append(key, value);

  const queryString = query.toString();
  return queryString ? `${safePath}?${queryString}` : safePath;
}

/**
 * Destino do login preservando para onde o usuário queria ir (`/login?next=...`).
 * Só aceita caminhos internos, para evitar open redirect via `next`.
 */
export function buildLoginRedirect(
  path: string,
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): string {
  return `/login?${new URLSearchParams({ next: buildReturnTarget(path, searchParams) })}`;
}

export const PASSWORD_CHANGE_PATH = '/conta/senha';

/** Troca obrigatória de senha preservando o destino (`/conta/senha?next=...`). */
export function buildPasswordChangeRedirect(
  path: string,
  searchParams?: Record<string, string | string[] | undefined> | URLSearchParams
): string {
  const next = buildReturnTarget(path, searchParams);
  return `${PASSWORD_CHANGE_PATH}?${new URLSearchParams({ next })}`;
}

const SAME_ORIGIN_BASE = 'http://base-de-conhecimento.local';

/**
 * Valida o `next` recebido na URL do login antes de redirecionar.
 * Aceita só caminhos da própria aplicação; qualquer outra coisa vira `fallback`.
 */
export function sanitizeNextPath(value: unknown, fallback = '/artigos'): string {
  if (typeof value !== 'string' || !value.startsWith('/')) return fallback;
  // "//host" e "/\host" são interpretados pelos navegadores como outra origem.
  if (value.startsWith('//') || value.startsWith('/\\')) return fallback;
  // Caracteres de controle (ex.: tab/quebra de linha) podem ser descartados pelo navegador.
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;

  let url: URL;
  try {
    url = new URL(value, SAME_ORIGIN_BASE);
  } catch {
    return fallback;
  }
  if (url.origin !== SAME_ORIGIN_BASE) return fallback;
  if (url.pathname === '/login' || url.pathname.startsWith('/login/')) return fallback;
  // Voltar para a troca de senha ou para o cadastro depois de concluí-los seria um ciclo.
  if (url.pathname === PASSWORD_CHANGE_PATH || url.pathname === '/cadastro') return fallback;
  return `${url.pathname}${url.search}${url.hash}`;
}
