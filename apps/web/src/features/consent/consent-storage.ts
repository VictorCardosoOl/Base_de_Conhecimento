import { safeStorage } from '@/lib/storage';

/**
 * Decisão de consentimento (LGPD) guardada no navegador.
 *
 * Fonte única da chave: o banner grava e o contexto lê; a telemetria (Sentry) e as
 * métricas locais de uso só funcionam com 'granted'. Sem decisão gravada = 'pending'.
 */
export type ConsentStatus = 'granted' | 'denied' | 'pending';

export const CONSENT_STORAGE_KEY = 'sst_user_cookie_consent';

/** Disparado em window a cada decisão, com o novo status em `detail`. */
export const CONSENT_UPDATED_EVENT = 'sst_consent_updated';

/** No servidor não há consentimento: sempre false. */
export function hasUserConsented(): boolean {
  return safeStorage.getString(CONSENT_STORAGE_KEY, '') === 'granted';
}
