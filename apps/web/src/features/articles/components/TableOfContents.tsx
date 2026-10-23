import React, { useEffect, useRef, useState } from 'react';
import { ListFilter } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 para h2, 3 para h3
}

interface TableOfContentsProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onNavigate?: (id: string) => void;
  /** Quem rola: o próprio contêiner (modal) ou a janela (página do artigo). */
  scrollRoot?: 'container' | 'viewport';
  /** Onde procurar os títulos (o corpo do artigo); padrão: o contêiner. */
  contentRef?: React.RefObject<HTMLElement | null>;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  containerRef,
  scrollRoot = 'container',
  contentRef,
}) => {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');
  const navRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);

  // 1. Cabeçalhos do corpo do artigo. O corpo chega depois (import dinâmico, conteúdo
  //    carregado sob demanda): reexamina quando o conteúdo muda, com um pequeno atraso.
  useEffect(() => {
    const scope = (contentRef ?? containerRef).current;
    if (!scope) return;
    let timer = 0;

    const scan = () => {
      const tocItems: TocItem[] = [];
      scope.querySelectorAll('h2, h3').forEach((heading, idx) => {
        let id = heading.id;
        if (!id) {
          id = `toc-${idx}-${
            heading.textContent
              ?.toLowerCase()
              .replace(/[^a-z0-9]/g, '-')
              .replace(/-+/g, '-') || idx
          }`;
          heading.id = id;
        }
        tocItems.push({
          id,
          text: heading.textContent || `Seção ${idx + 1}`,
          level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3,
        });
      });
      // Mesmo índice de antes: não re-renderiza.
      setItems((prev) =>
        prev.length === tocItems.length && prev.every((item, i) => item.id === tocItems[i].id)
          ? prev
          : tocItems
      );
      setActiveId((current) => current || tocItems[0]?.id || '');
    };
    const schedule = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(scan, 80);
    };

    schedule();
    // Só a árvore do artigo, só inserções/remoções (o id que o scan grava não dispara).
    const observer = new MutationObserver(schedule);
    observer.observe(scope, { childList: true, subtree: true });
    return () => {
      window.clearTimeout(timer);
      observer.disconnect();
    };
  }, [containerRef, contentRef]);

  // 2. Scrollspy via IntersectionObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container || items.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        root: scrollRoot === 'viewport' ? null : container,
        rootMargin: '0px 0px -60% 0px',
        threshold: 0.1,
      }
    );

    items.forEach((item) => {
      const el = container.querySelector(`#${item.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items, containerRef, scrollRoot]);

  // Indicador de vidro que desliza até o item ativo.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav || !activeId) return;
    const button = Array.from(nav.querySelectorAll<HTMLElement>('[data-toc-id]')).find(
      (el) => el.dataset.tocId === activeId
    );
    const indicator = indicatorRef.current;
    if (!button || !indicator) return;
    indicator.style.transform = `translateY(${button.offsetTop}px)`;
    indicator.style.height = `${button.offsetHeight}px`;
    indicator.style.opacity = '1';
  }, [activeId, items]);

  const scrollToHeading = (id: string) => {
    const container = containerRef.current;
    if (!container) return;

    const target = container.querySelector(`#${id}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveId(id);
    }
  };

  if (items.length < 2) return null;

  return (
    <aside className="sticky top-24 p-2 text-xs border-l border-border pl-6" aria-label="Neste artigo">
      <div className="flex items-center gap-2 pb-3 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-text-muted font-mono">
        <ListFilter size={13} className="text-text-main" aria-hidden="true" />
        <span>Neste Artigo</span>
      </div>

      <nav ref={navRef} className="relative space-y-1 max-h-[65vh] overflow-y-auto no-scrollbar">
        <span
          ref={indicatorRef}
          aria-hidden="true"
          className="absolute top-0 left-0 right-0 h-0 opacity-0 rounded-[20px] bg-black/5 dark:bg-white/10 shadow-xs transition-[transform,height,opacity] duration-300 ease-[var(--ease-elastic)] motion-reduce:transition-none"
        >
          <span className="absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full bg-text-main" />
        </span>
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              data-toc-id={item.id}
              onClick={() => scrollToHeading(item.id)}
              aria-current={isActive ? 'location' : undefined}
              className={`relative block w-full text-left rounded-[20px] py-2 pr-2 transition-colors duration-200 glass-focus ${
                item.level === 3 ? 'pl-7 text-[11px]' : 'pl-4 font-medium text-xs'
              } ${
                isActive ? 'text-text-main font-semibold' : 'text-text-muted hover:text-text-main'
              }`}
            >
              <span className="line-clamp-2 leading-relaxed">{item.text}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
