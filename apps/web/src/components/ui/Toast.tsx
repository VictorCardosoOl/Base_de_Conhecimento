'use client';
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { X } from 'lucide-react';

export type ToastTone = 'info' | 'success' | 'danger';

interface ToastItem {
  id: number;
  tone: ToastTone;
  title: string;
  message?: string;
}

interface ToastApi {
  show: (toast: { tone?: ToastTone; title: string; message?: string }) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const DURATION_MS = 5000;

/**
 * Notificações passageiras num único lugar da tela. A região é `aria-live` (polite):
 * leitores de tela anunciam sem roubar o foco. Somem sozinhas ou pelo botão Fechar.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((item) => item.id !== id));
  }, []);

  const show = useCallback<ToastApi['show']>(
    ({ tone = 'info', title, message }) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-2), { id, tone, title, message }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss]
  );

  const api = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="ui-toast-region" role="status" aria-live="polite">
        {items.map((item) => (
          <div key={item.id} className="ui-toast" data-tone={item.tone}>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-main">{item.title}</p>
              {item.message && <p className="mt-0.5 text-[13px] text-text-muted leading-snug">{item.message}</p>}
            </div>
            <button
              type="button"
              aria-label="Fechar notificação"
              onClick={() => dismiss(item.id)}
              className="ui-btn ui-btn--ghost ui-btn--sm ui-btn--icon -mr-2 -mt-1"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/** Sem provedor (ex.: testes isolados), as notificações viram no-op. */
const NOOP: ToastApi = { show: () => undefined };

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP;
}
