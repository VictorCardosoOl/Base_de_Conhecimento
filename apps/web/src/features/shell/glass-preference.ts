import { safeStorage } from '@/lib/storage';

/**
 * Preferência de efeitos visuais escolhida pela pessoa (fica neste navegador).
 *
 * - auto: decide pelo aparelho (núcleos, memória, Save-Data, transparência reduzida);
 * - full: vidro completo, com desfoque no cromo;
 * - lite: superfícies sólidas, sem desfoque (mais leve para bateria e GPU).
 */
export type GlassPreference = 'auto' | 'full' | 'lite';

export const GLASS_PREFERENCE_KEY = 'sst_glass_preference';
export const GLASS_PREFERENCE_EVENT = 'sst:glass-preference';

export function readGlassPreference(): GlassPreference {
  const value = safeStorage.getString(GLASS_PREFERENCE_KEY, 'auto');
  return value === 'full' || value === 'lite' ? value : 'auto';
}

export function writeGlassPreference(value: GlassPreference): void {
  if (value === 'auto') {
    safeStorage.removeItem(GLASS_PREFERENCE_KEY);
  } else {
    safeStorage.setItem(GLASS_PREFERENCE_KEY, value);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(GLASS_PREFERENCE_EVENT, { detail: value }));
  }
}

export function subscribeGlassPreference(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(GLASS_PREFERENCE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(GLASS_PREFERENCE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
