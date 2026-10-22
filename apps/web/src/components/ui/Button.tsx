import React from 'react';
import Link from 'next/link';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

interface StyleProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  /** Só ícone: o nome acessível vem de aria-label. */
  icon?: boolean;
}

/** Classes do botão, para quando o elemento não é um <button> (ex.: link). */
export function buttonClass({ variant = 'secondary', size = 'md', block, icon }: StyleProps = {}, extra = '') {
  return [
    'ui-btn',
    variant !== 'secondary' && `ui-btn--${variant}`,
    size === 'sm' && 'ui-btn--sm',
    block && 'ui-btn--block',
    icon && 'ui-btn--icon',
    extra,
  ]
    .filter(Boolean)
    .join(' ');
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  StyleProps & {
    /** Em andamento: desabilita e troca o texto (anunciado via aria-busy). */
    loading?: boolean;
    loadingText?: string;
  };

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant,
    size,
    block,
    icon,
    loading = false,
    loadingText,
    className = '',
    type = 'button',
    disabled,
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={buttonClass({ variant, size, block, icon }, className)}
      {...rest}
    >
      {loading && loadingText ? loadingText : children}
    </button>
  );
});

type ButtonLinkProps = React.ComponentProps<typeof Link> & StyleProps;

export function ButtonLink({ variant, size, block, icon, className = '', ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass({ variant, size, block, icon }, className)} {...rest} />;
}
