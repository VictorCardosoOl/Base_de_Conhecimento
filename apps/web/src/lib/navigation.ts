/**
 * Navegação completa (recarrega o documento).
 *
 * Usada nas fronteiras da autenticação (login, renovação silenciosa, logout):
 * - evita corrida com uma navegação do roteador ainda em andamento (ex.: o redirect
 *   do proxy para /login durante uma navegação no cliente);
 * - garante que o servidor renderize com os cookies novos;
 * - descarta o cache do roteador feito com a sessão anterior.
 */
export function hardNavigate(url: string): void {
  window.location.replace(url);
}
