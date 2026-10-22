/**
 * Versão da aplicação exibida no rodapé (versionamento semântico: MAJOR.MINOR.PATCH).
 * Atualizada manualmente a cada entrega: altere só este valor.
 */
export const APP_VERSION = '2.0.0';

/** Forma exibida ao público (ex.: "v2.0.0"). */
export const APP_VERSION_LABEL = `v${APP_VERSION}`;

/**
 * Página com as notas desta versão (changelog), quando existir. Com um endereço aqui, o
 * botão da versão no rodapé passa a abrir essa página; sem ele (null), o botão copia a
 * versão para a área de transferência (útil para relatar problemas ao suporte).
 */
export const APP_RELEASE_NOTES_URL: string | null = null;
