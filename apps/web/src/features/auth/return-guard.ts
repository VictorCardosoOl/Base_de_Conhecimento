/**
 * Proteção contra loop login ↔ destino.
 *
 * Se o AuthService grava a sessão mas o servidor do Next não a enxerga (ex.: nome do
 * cookie divergente entre AUTH_ACCESS_COOKIE_NAME e o AuthService, ou cookie `Secure`
 * sem HTTPS), cada volta ao destino cai de novo no /login, que renova a sessão em
 * silêncio e volta ao destino — indefinidamente. Guardamos só o destino e o horário
 * da última volta (nenhum dado de sessão) para detectar a repetição e parar.
 */

const KEY = 'kb:auth-return';
export const RETURN_LOOP_WINDOW_MS = 15_000;

interface ReturnMark {
  next: string;
  at: number;
}

function storage(): Storage | null {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

/** Registra que vamos voltar ao destino após autenticar. */
export function markAuthReturn(next: string, now = Date.now()): void {
  try {
    storage()?.setItem(KEY, JSON.stringify({ next, at: now } satisfies ReturnMark));
  } catch {
    // Sem storage não há proteção, mas o fluxo normal segue funcionando.
  }
}

/** Voltamos ao mesmo destino há instantes e caímos no login de novo? */
export function isAuthReturnLoop(next: string, now = Date.now()): boolean {
  try {
    const raw = storage()?.getItem(KEY);
    if (!raw) return false;
    const mark = JSON.parse(raw) as Partial<ReturnMark>;
    return mark.next === next && typeof mark.at === 'number' && now - mark.at >= 0 && now - mark.at < RETURN_LOOP_WINDOW_MS;
  } catch {
    return false;
  }
}

/**
 * O destino `path` abriu com sessão válida: a volta deu certo e a marca não serve mais.
 * Só apaga a marca do próprio destino. Num loop real o destino nunca abre (o servidor
 * redireciona antes), então a marca fica e o loop continua sendo detectado.
 */
export function settleAuthReturn(path: string): void {
  try {
    const raw = storage()?.getItem(KEY);
    if (raw && (JSON.parse(raw) as Partial<ReturnMark>).next === path) storage()?.removeItem(KEY);
  } catch {
    // ignorado
  }
}

export function clearAuthReturn(): void {
  try {
    storage()?.removeItem(KEY);
  } catch {
    // ignorado
  }
}
