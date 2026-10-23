import { useMemo } from 'react';
import { sanitizeArticleHtml } from '@/features/articles/sanitize-html';
import type { HighlightItem } from '@/features/reading/reading-experience-service';

const VALID_HIGHLIGHT_COLORS: ReadonlyArray<HighlightItem['color']> = [
  'yellow',
  'green',
  'blue',
  'pink',
];

/**
 * Hook dedicado a aplicar marcações de texto mantendo total isolamento contra XSS
 * Cria nós DOM explicitamente com document.createElement('mark') e document.createTextNode()
 * evitando concatenação direta de strings em innerHTML.
 */
export function useTextHighlighter(
  htmlContent: string,
  highlights: HighlightItem[],
  isMounted: boolean
): string {
  return useMemo(() => {
    if (!htmlContent) return '';

    const safeHtml = sanitizeArticleHtml(htmlContent);
    if (!isMounted || highlights.length === 0) return safeHtml;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(safeHtml, 'text/html');
      const walker = document.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT, null);

      const nodesToReplace: { node: Text; newNodes: Node[] }[] = [];

      let node: Node | null;
      while ((node = walker.nextNode())) {
        const text = node.nodeValue;
        if (!text || text.trim() === '') continue;

        let fragments: (string | { text: string; color: HighlightItem['color'] })[] = [text];

        highlights.forEach((h) => {
          if (!h.text) return;
          const escaped = h.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const safeColor = VALID_HIGHLIGHT_COLORS.includes(h.color) ? h.color : 'yellow';
          const regex = new RegExp(`(${escaped})`, 'gi');

          const nextFragments: (string | { text: string; color: HighlightItem['color'] })[] = [];

          fragments.forEach((frag) => {
            if (typeof frag !== 'string') {
              nextFragments.push(frag);
              return;
            }

            const parts = frag.split(regex);
            parts.forEach((part) => {
              if (!part) return;
              if (part.toLowerCase() === h.text.toLowerCase()) {
                nextFragments.push({ text: part, color: safeColor });
              } else {
                nextFragments.push(part);
              }
            });
          });

          fragments = nextFragments;
        });

        const hasMatch = fragments.some((frag) => typeof frag !== 'string');
        if (hasMatch) {
          const domNodes: Node[] = fragments.map((frag) => {
            if (typeof frag === 'string') {
              return doc.createTextNode(frag);
            }
            const mark = doc.createElement('mark');
            mark.className = `sst-highlight-${frag.color}`;
            mark.textContent = frag.text;
            return mark;
          });

          nodesToReplace.push({ node: node as Text, newNodes: domNodes });
        }
      }

      nodesToReplace.forEach(({ node: targetNode, newNodes }) => {
        const parent = targetNode.parentNode;
        if (parent) {
          newNodes.forEach((n) => parent.insertBefore(n, targetNode));
          parent.removeChild(targetNode);
        }
      });

      return sanitizeArticleHtml(doc.body.innerHTML);
    } catch {
      return safeHtml;
    }
  }, [htmlContent, highlights, isMounted]);
}
