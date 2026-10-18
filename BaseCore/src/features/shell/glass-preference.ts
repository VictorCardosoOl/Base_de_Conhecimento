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
  try {
    const value = window.localStorage.getItem(GLASS_PREFERENCE_KEY);
    return value === 'full' || value === 'lite' ? value : 'auto';
  } catch {
    return 'auto';
  }
}

export function writeGlassPreference(value: GlassPreference): void {
  try {
    if (value === 'auto') window.localStorage.removeItem(GLASS_PREFERENCE_KEY);
    else window.localStorage.setItem(GLASS_PREFERENCE_KEY, value);
  } catch {
    // Armazenamento bloqueado: vale só até recarregar.
  }
  window.dispatchEvent(new CustomEvent(GLASS_PREFERENCE_EVENT, { detail: value }));
}

export function subscribeGlassPreference(onChange: () => void): () => void {
  window.addEventListener(GLASS_PREFERENCE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(GLASS_PREFERENCE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}
