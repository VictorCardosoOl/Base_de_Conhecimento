import React, { useEffect, useState } from 'react';
import { ListFilter } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number; // 2 para h2, 3 para h3
}

interface TableOfContentsProps {
  containerRef: React.RefObject<HTMLElement | null>;
  onNavigate?: (id: string) => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ containerRef }) => {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>('');

  // 1. Extrair cabeçalhos e injetar IDs caso não tenham
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Timeout curto para permitir a renderização completa do innerHTML
    const timer = setTimeout(() => {
      const headings = container.querySelectorAll('h2, h3');
      const tocItems: TocItem[] = [];

      headings.forEach((heading, idx) => {
        let id = heading.id;
        if (!id) {
          id = `toc-${idx}-${heading.textContent?.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') || idx}`;
          heading.id = id;
        }

        tocItems.push({
          id,
          text: heading.textContent || `Seção ${idx + 1}`,
          level: heading.tagName.toLowerCase() === 'h2' ? 2 : 3
        });
      });

      setItems(tocItems);
      if (tocItems.length > 0 && !activeId) {
        setActiveId(tocItems[0].id);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [containerRef]);

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
        root: container,
        rootMargin: '0px 0px -60% 0px',
        threshold: 0.1
      }
    );

    items.forEach((item) => {
      const el = container.querySelector(`#${item.id}`);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items, containerRef]);

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
    <aside className="sticky top-24 space-y-3 p-4 border-l border-border text-xs">
      <div className="flex items-center gap-2 pb-2 text-[10px] font-mono uppercase tracking-widest text-text-muted">
        <ListFilter size={13} />
        <span>Neste Artigo</span>
      </div>

      <nav className="space-y-1.5 max-h-[70vh] overflow-y-auto no-scrollbar">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollToHeading(item.id)}
              className={`block w-full text-left transition-colors duration-150 ${
                item.level === 3 ? 'pl-3 text-[11px]' : 'font-medium text-xs'
              } ${
                isActive
                  ? 'text-text-main font-semibold border-l-2 border-text-main -ml-[17px] pl-[15px]'
                  : 'text-text-muted hover:text-text-main'
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
