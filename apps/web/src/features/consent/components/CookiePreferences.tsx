'use client';
import React, { useId, useState } from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/Dialog';
import { useToast } from '@/components/ui/Toast';
import { useConsent } from '@/features/consent/ConsentContext';
import { FEATURE_ITEMS, clearFeatureData } from '@/features/consent/storage-inventory';

/** O monitoramento só existe quando a instalação tem um DSN do Sentry configurado. */
export const MONITORING_AVAILABLE = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

const STATUS_LABEL = {
  granted: 'Permitido',
  denied: 'Não permitido',
  pending: 'Nenhuma escolha registrada',
} as const;

type Choice = 'granted' | 'denied';

function countFeatureData(): number {
  try {
    return FEATURE_ITEMS.filter((item) => window.localStorage.getItem(item.name) !== null).length;
  } catch {
    return 0;
  }
}

/**
 * Controles reais das preferências: grava a escolha (a mesma do aviso de cookies),
 * aplica na hora (o monitoramento inicia ou é encerrado pelo layout) e permite apagar
 * os dados de recursos guardados neste aparelho.
 */
export function CookiePreferences() {
  const toast = useToast();
  const { consent, acceptAll, rejectAll, resetConsent } = useConsent();
  const name = useId();
  const [choice, setChoice] = useState<Choice | null>(null);
  const [status, setStatus] = useState('');
  const [localCount, setLocalCount] = useState<number | null>(() => (typeof window !== 'undefined' ? countFeatureData() : null));
  const [confirmClear, setConfirmClear] = useState(false);

  // A escolha gravada chega depois da hidratação (localStorage).
  const current: Choice | null = consent === 'pending' ? null : consent;
  const selected = choice ?? current;

  const save = () => {
    if (!selected) return;
    if (selected === 'granted') acceptAll();
    else rejectAll();
    setChoice(null);
    const message =
      selected === 'granted'
        ? MONITORING_AVAILABLE
          ? 'Monitoramento permitido neste navegador.'
          : 'Permissão registrada. O monitoramento será usado somente se for ativado nesta instalação.'
        : 'Monitoramento não permitido. Nenhum dado de monitoramento será enviado deste navegador.';
    setStatus(message);
    toast.show({ tone: 'success', title: 'Preferências salvas', message });
  };

  const clearChoice = () => {
    resetConsent();
    setChoice(null);
    const message = 'Escolha apagada. O aviso de cookies voltará a ser exibido.';
    setStatus(message);
    toast.show({ title: 'Escolha apagada', message });
  };

  const clearLocal = () => {
    clearFeatureData();
    setConfirmClear(false);
    setLocalCount(0);
    // Recarrega para que tema, Minha Lista e demais recursos reflitam a limpeza.
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <section aria-labelledby="pref-monitoring" className="glass-flat p-5 sm:p-6">
        <h3 id="pref-monitoring" className="!mt-0">
          Monitoramento de erros e desempenho
        </h3>
        <p className="text-sm text-text-muted">
          Situação atual: <strong className="text-text-main">{STATUS_LABEL[consent]}</strong>
        </p>
        {!MONITORING_AVAILABLE && (
          <Alert tone="info" className="mt-3">
            Nesta instalação, o monitoramento não está ativado. Sua escolha fica registrada e será respeitada se ele for ativado.
          </Alert>
        )}
        <fieldset className="mt-4">
          <legend className="sr-only">Monitoramento de erros e desempenho</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                { value: 'granted', label: 'Permitir', hint: 'Envia relatórios de erros e medições de desempenho ao Sentry.' },
                { value: 'denied', label: 'Não permitir', hint: 'Nenhum dado de monitoramento é enviado.' },
              ] as const
            ).map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2.5 rounded-[var(--glass-radius-sm)] border border-[color:color-mix(in_srgb,var(--text-main)_14%,transparent)] p-3 has-[:checked]:border-[color:var(--mesh-1)] has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[color:var(--mesh-1)]"
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={selected === option.value}
                  onChange={() => setChoice(option.value)}
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="primary" onClick={save} disabled={!selected || selected === current}>
            Salvar preferências
          </Button>
          <Button variant="ghost" onClick={clearChoice} disabled={consent === 'pending'}>
            Apagar minha escolha
          </Button>
        </div>
        <p className="mt-3 text-sm text-text-muted" role="status" aria-live="polite">
          {status}
        </p>
      </section>

      <section aria-labelledby="pref-local" className="glass-flat p-5 sm:p-6">
        <h3 id="pref-local" className="!mt-0">
          Dados de recursos neste aparelho
        </h3>
        <p className="text-sm text-text-muted">
          {localCount === null
            ? 'Verificando os dados guardados neste navegador…'
            : localCount === 0
              ? 'Não há dados de recursos guardados neste navegador.'
              : `${localCount} ${localCount === 1 ? 'item guardado' : 'itens guardados'} neste navegador (tema, Minha Lista, preferências de leitura e similares).`}
        </p>
        <div className="mt-4">
          <Button onClick={() => setConfirmClear(true)} disabled={!localCount}>
            Apagar dados locais
          </Button>
        </div>
      </section>

      <ConfirmDialog
        open={confirmClear}
        onCancel={() => setConfirmClear(false)}
        onConfirm={clearLocal}
        danger
        title="Apagar os dados deste aparelho?"
        description="Minha Lista, artigos lidos, meta de leitura, destaques, buscas recentes e preferências de tema e leitura serão apagados deste navegador. Sua conta e sua escolha sobre cookies não são afetadas. A página será recarregada."
        confirmLabel="Apagar dados locais"
      />
    </div>
  );
}
