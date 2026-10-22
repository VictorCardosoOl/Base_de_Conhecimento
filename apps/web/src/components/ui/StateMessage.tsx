import React from 'react';
import { AlertTriangle, Inbox } from 'lucide-react';

interface StateProps {
  title: React.ReactNode;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  /** Ações (ex.: "Tentar novamente", "Ver todos os artigos"). */
  action?: React.ReactNode;
  className?: string;
}

/** Nada para mostrar ainda, com o próximo passo quando houver. */
export function EmptyState({ title, children, icon, action, className = '' }: StateProps) {
  return (
    <div className={`ui-state ${className}`}>
      <span className="ui-state-icon">{icon ?? <Inbox size={20} aria-hidden="true" />}</span>
      <p className="text-base font-semibold text-text-main">{title}</p>
      {children && <div className="max-w-md text-sm leading-relaxed">{children}</div>}
      {action && <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Falha ao carregar: explica sem detalhes técnicos e oferece como seguir. */
export function ErrorState({ title, children, icon, action, className = '' }: StateProps) {
  return (
    <div role="alert" data-tone="danger" className={`ui-state ${className}`}>
      <span className="ui-state-icon">{icon ?? <AlertTriangle size={20} aria-hidden="true" />}</span>
      <p className="text-base font-semibold text-text-main">{title}</p>
      {children && <div className="max-w-md text-sm leading-relaxed">{children}</div>}
      {action && <div className="mt-3 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  );
}

/** Bloco de espera estático (sem animação contínua: custo zero enquanto espera). */
export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`ui-skeleton ${className}`} />;
}
