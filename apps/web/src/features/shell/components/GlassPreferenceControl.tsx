'use client';
import React, { useId, useSyncExternalStore } from 'react';
import {
  type GlassPreference,
  readGlassPreference,
  subscribeGlassPreference,
  writeGlassPreference,
} from '@/features/shell/glass-preference';

const OPTIONS: Array<{ value: GlassPreference; label: string; hint: string }> = [
  { value: 'auto', label: 'Automático', hint: 'Decide pelo desempenho do aparelho' },
  { value: 'full', label: 'Completo', hint: 'Vidro com desfoque no cabeçalho e no menu' },
  { value: 'lite', label: 'Reduzido', hint: 'Superfícies sólidas: mais leve e econômico' },
];

const readOnServer = (): GlassPreference => 'auto';

/** Escolha manual do modo de efeitos visuais (radio group nativo: setas e Tab funcionam). */
export function GlassPreferenceControl({ className = '' }: { className?: string }) {
  const value = useSyncExternalStore(subscribeGlassPreference, readGlassPreference, readOnServer);
  const name = useId();
  return (
    <fieldset className={className}>
      <legend className="ui-label mb-2">Efeitos visuais</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((option) => (
          <label
            key={option.value}
            className="glass-flat flex cursor-pointer items-start gap-2.5 p-3 has-[:checked]:border-[color:var(--mesh-1)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--mesh-1)]"
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => writeGlassPreference(option.value)}
              className="mt-1 accent-[color:var(--mesh-1)]"
            />
            <span>
              <span className="block text-sm font-semibold text-text-main">{option.label}</span>
              <span className="block text-xs text-text-muted leading-snug">{option.hint}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
