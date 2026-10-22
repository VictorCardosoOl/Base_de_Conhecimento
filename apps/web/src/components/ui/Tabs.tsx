'use client';
import React, { useRef } from 'react';

export interface TabItem<T extends string> {
  id: T;
  label: React.ReactNode;
  /** Contagem opcional exibida ao lado do rótulo. */
  count?: number;
}

/**
 * Abas acessíveis (padrão WAI-ARIA): Tab entra na aba ativa, setas trocam de aba,
 * Home/End vão às pontas. O painel usa `tabPanelProps` para se ligar à aba.
 */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  className = '',
}: {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  label: string;
  idPrefix: string;
  className?: string;
}) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const move = (index: number) => {
    const next = (index + items.length) % items.length;
    onChange(items[next].id);
    refs.current[next]?.focus();
  };
  const onKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowRight') move(index + 1);
    else if (event.key === 'ArrowLeft') move(index - 1);
    else if (event.key === 'Home') move(0);
    else if (event.key === 'End') move(items.length - 1);
    else return;
    event.preventDefault();
  };
  return (
    <div role="tablist" aria-label={label} className={`ui-tabs ${className}`}>
      {items.map((item, index) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            ref={(el) => {
              refs.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-controls={`${idPrefix}-panel-${item.id}`}
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className="ui-tab"
          >
            {item.label}
            {typeof item.count === 'number' && <span className="tabular-nums opacity-70"> {item.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function tabPanelProps(idPrefix: string, id: string) {
  return {
    role: 'tabpanel' as const,
    id: `${idPrefix}-panel-${id}`,
    'aria-labelledby': `${idPrefix}-tab-${id}`,
    tabIndex: 0,
  };
}
