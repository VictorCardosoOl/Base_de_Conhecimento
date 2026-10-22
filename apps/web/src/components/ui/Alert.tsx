import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

export type Tone = 'info' | 'success' | 'warning' | 'danger';

const ICONS = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle };

/**
 * Aviso em linha. Erros (danger) usam role="alert" e são anunciados na hora; os demais,
 * role="status", sem interromper a leitura.
 */
export function Alert({
  tone = 'info',
  title,
  children,
  className = '',
  role,
}: {
  tone?: Tone;
  title?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  role?: 'alert' | 'status' | 'note';
}) {
  const Icon = ICONS[tone];
  return (
    <div role={role ?? (tone === 'danger' ? 'alert' : 'status')} data-tone={tone} className={`ui-alert ${className}`}>
      <Icon size={16} aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : undefined}>{children}</div>}
      </div>
    </div>
  );
}
